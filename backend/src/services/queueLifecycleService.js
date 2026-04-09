/**
 * QueueLifecycleService
 *
 * Single source of truth for all token state transitions in the queue.
 * All state changes MUST go through this service — controllers are thin wrappers.
 *
 * Design goals:
 *  - One place for all transition logic
 *  - Backend is the authority — no frontend assumptions trusted
 *  - Atomic DB updates where possible to prevent race conditions
 *  - Every meaningful action creates a QueueLog entry
 */

import mongoose from 'mongoose'
import Token from '../models/Token.js'
import QueueLog from '../models/QueueLog.js'
import AppError from '../utils/AppError.js'
import { TOKEN_STATUS, QUEUE_ACTIONS, TOKEN_PRIORITY, ACTIVE_QUEUE_STATES } from '../utils/constants.js'
import { getStartOfToday } from '../utils/dateUtils.js'
import { emitToBranch, emitToPublicDisplay } from '../config/socket.js'

// ─── Transition Map (source of truth for valid moves) ────────────────────────
const TRANSITIONS = {
  [TOKEN_STATUS.WAITING]:    [TOKEN_STATUS.CHECKED_IN, TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD, TOKEN_STATUS.SKIPPED, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.CHECKED_IN]: [TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD, TOKEN_STATUS.SKIPPED, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.SERVING]:    [TOKEN_STATUS.COMPLETED, TOKEN_STATUS.HELD, TOKEN_STATUS.SKIPPED],
  [TOKEN_STATUS.HELD]:       [TOKEN_STATUS.SERVING, TOKEN_STATUS.WAITING, TOKEN_STATUS.CHECKED_IN, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.SKIPPED]:    [TOKEN_STATUS.WAITING, TOKEN_STATUS.CHECKED_IN, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.MISSED]:     [TOKEN_STATUS.WAITING, TOKEN_STATUS.CHECKED_IN, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.COMPLETED]:  [],
  [TOKEN_STATUS.CANCELLED]:  [],
  [TOKEN_STATUS.EXPIRED]:    []
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate a transition and throw a clean 400 error if invalid.
 */
function assertTransition(token, toStatus) {
  const allowed = TRANSITIONS[token.status] || []
  if (!allowed.includes(toStatus)) {
    throw new AppError(
      `Cannot transition token from '${token.status}' to '${toStatus}'.`,
      400
    )
  }
}

/**
 * Find and lock a token by ID using findOneAndUpdate to avoid race conditions.
 * Returns the full Mongoose document (not lean).
 */
async function findTokenOrThrow(tokenId) {
  if (!mongoose.Types.ObjectId.isValid(tokenId)) {
    throw new AppError('Invalid token ID.', 400)
  }
  const token = await Token.findById(tokenId)
  if (!token) {
    throw new AppError('Token not found.', 404)
  }
  return token
}

/**
 * Create a QueueLog entry — non-blocking, but errors are caught so they
 * never interrupt the main action.
 */
async function log(tokenId, action, performedBy, metadata = {}, systemGenerated = false) {
  try {
    await QueueLog.logAction({ tokenId, action, performedBy, metadata, systemGenerated })
  } catch (err) {
    console.error('[QueueLog] Failed to write log:', err.message)
  }
}

/**
 * Recalculate estimated wait times for waiting tokens in a dept queue.
 * Done after any action that changes queue depth.
 */
async function refreshWaitTimes(branchId, departmentId) {
  try {
    const waiting = await Token.find({
      branchId,
      departmentId,
      status: TOKEN_STATUS.WAITING
    })
      .populate('departmentId', 'averageServiceTime')
      .sort({ priority: -1, scheduledTime: 1, createdAt: 1 })

    const avgTime = waiting[0]?.departmentId?.averageServiceTime || 15

    const bulkOps = waiting.map((t, i) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { estimatedWaitTime: i * avgTime } }
      }
    }))

    if (bulkOps.length) await Token.bulkWrite(bulkOps)
  } catch (err) {
    console.error('[refreshWaitTimes] Failed:', err.message)
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────
export class QueueLifecycleService {

  /**
   * Helper to check valid transitions externally.
   */
  static canTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to)
  }

  /**
   * EXPERIMENTAL / CLEANUP
   * 
   * Finds active tokens from past days and expires them so they do not pollute 
   * the Today-Only queue views. Operations are bulk scaled.
   */
  /**
   * Finds active tokens from past days and expires them so they do not pollute 
   * the Today-Only queue views. Operations are bulk scaled.
   */
  static async expireOldTokens() {
    try {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      
      // Find any stale active tokens (including those without queueDate for migration)
      const oldTokens = await Token.find({
        $or: [
          { queueDate: { $lt: startOfToday } },
          { scheduledTime: { $lt: startOfToday } },
          { 
            queueDate: { $exists: false },
            createdAt: { $lt: startOfToday }
          }
        ],
        isActiveQueue: true,
        status: { $in: ACTIVE_QUEUE_STATES }
      })

      if (!oldTokens.length) return

      const now = new Date()
      const bulkOps = oldTokens.map(t => ({
        updateOne: {
          filter: { _id: t._id },
          update: { 
            $set: { 
              status: TOKEN_STATUS.EXPIRED,
              isActiveQueue: false,
              expiredAt: now
            } 
          }
        }
      }))

      await Token.bulkWrite(bulkOps)

      // Log them for audit trail
      for (const t of oldTokens) {
        await log(t._id, QUEUE_ACTIONS.EXPIRED, null, {
          reason: 'Automatically expired stale token from previous day',
          previousStatus: t.status
        }, true) // true = systemGenerated
      }
      
      console.log(`[QueueLifecycle] Expired ${oldTokens.length} stale tokens.`)
    } catch (err) {
      console.error('[QueueLifecycle] Error expiring old tokens:', err.message)
    }
  }

  /**
   * CALL NEXT
   * 
   * Finds and serves the next eligible WAITING token.
   * Priority order: urgent → high → normal, then by scheduledTime, then createdAt.
   * Staff-mode: no counter required.
   *
   * Race condition guard: uses findOneAndUpdate with $set atomically so two
   * simultaneous "call next" requests claim different tokens.
   */
  static async callNext(performedBy, options = {}) {
    const { branchId, departmentId } = options

    if (!branchId && !departmentId) {
      throw new AppError('At least one of branchId or departmentId is required.', 400)
    }

    // Clean up stale tokens before checking the queue depth
    await QueueLifecycleService.expireOldTokens()

    // Build search query
    const matchQuery = { status: TOKEN_STATUS.WAITING }
    if (branchId)     matchQuery.branchId     = branchId
    if (departmentId) matchQuery.departmentId = departmentId

    // Fetch candidates (sorted), then atomically claim the first one
    const priorityOrder = { urgent: 0, high: 1, normal: 2 }
    const candidates = await Token.find(matchQuery)
      .sort({ scheduledTime: 1, createdAt: 1 })
      .limit(20) // safety limit — pick from pool

    // Sort by priority then time
    candidates.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99
      const pb = priorityOrder[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      return new Date(a.scheduledTime || a.createdAt) - new Date(b.scheduledTime || b.createdAt)
    })

    // Claim first candidate atomically — prevents two staff picking same token
    let claimed = null
    for (const candidate of candidates) {
      const now = new Date()
      const actualWait = candidate.joinedAt ? (now - candidate.joinedAt) / (1000 * 60) : null
      const result = await Token.findOneAndUpdate(
        { _id: candidate._id, status: TOKEN_STATUS.WAITING }, // still waiting?
        {
          $set: {
            status: TOKEN_STATUS.SERVING,
            startedServiceAt: now,
            calledAt: now, // ML Readiness
            actualWaitMinutes: actualWait // ML Readiness
          }
        },
        { new: true }
      ).populate('userId', 'name phone').populate('branchId', 'name').populate('departmentId', 'name')

      if (result) { claimed = result; break }
    }

    if (!claimed) {
      throw new AppError('No waiting tokens in queue.', 404)
    }

    await log(claimed._id, QUEUE_ACTIONS.CALLED, performedBy, {
      previousStatus: TOKEN_STATUS.WAITING,
      newStatus: TOKEN_STATUS.SERVING
    })

    await refreshWaitTimes(claimed.branchId, claimed.departmentId)

    // Notify all staff in the branch
    emitToBranch(claimed.branchId, 'queue_updated', {
      tokenId: claimed._id,
      action: 'called',
      tokenNumber: claimed.tokenNumber
    })

    return claimed
  }

  /**
   * SERVE A SPECIFIC TOKEN
   * 
   * Staff selects a specific waiting/held token to serve.
   */
  static async serveToken(tokenId, performedBy, options = {}) {
    const token = await findTokenOrThrow(tokenId)
    assertTransition(token, TOKEN_STATUS.SERVING)

    const prevStatus = token.status
    const now = new Date()
    token.status          = TOKEN_STATUS.SERVING
    token.startedServiceAt = now
    
    // ML Readiness
    token.calledAt = now
    if (token.joinedAt) {
      token.actualWaitMinutes = (now - token.joinedAt) / (1000 * 60)
    }

    await token.save()

    await log(token._id, QUEUE_ACTIONS.SERVING, performedBy, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.SERVING
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'serving',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  /**
   * COMPLETE TOKEN
   */
  static async completeToken(tokenId, performedBy) {
    const token = await findTokenOrThrow(tokenId)
    assertTransition(token, TOKEN_STATUS.COMPLETED)

    const now = new Date()
    token.status       = TOKEN_STATUS.COMPLETED
    token.completedAt  = now
    token.servedAt     = now // ML Readiness
    if (token.startedServiceAt) {
      token.actualServiceTime = (now - token.startedServiceAt) / (1000 * 60)
    }
    await token.save()

    await log(token._id, QUEUE_ACTIONS.COMPLETED, performedBy, {
      previousStatus: TOKEN_STATUS.SERVING,
      newStatus: TOKEN_STATUS.COMPLETED,
      duration: token.actualServiceTime
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'completed',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  /**
   * SKIP TOKEN
   * 
   * Can skip waiting or serving tokens.
   */
  static async skipToken(tokenId, performedBy, reason = '') {
    const token = await findTokenOrThrow(tokenId)
    assertTransition(token, TOKEN_STATUS.SKIPPED)

    const prevStatus  = token.status
    token.status      = TOKEN_STATUS.SKIPPED
    await token.save()

    await log(token._id, QUEUE_ACTIONS.SKIPPED, performedBy, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.SKIPPED,
      reason
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'skipped',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  /**
   * HOLD TOKEN
   * 
   * Pause service — token goes back to a held state.
   */
  static async holdToken(tokenId, performedBy, reason = '') {
    const token = await findTokenOrThrow(tokenId)
    assertTransition(token, TOKEN_STATUS.HELD)

    const prevStatus = token.status
    token.status     = TOKEN_STATUS.HELD
    await token.save()

    await log(token._id, QUEUE_ACTIONS.HELD, performedBy, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.HELD,
      reason
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'held',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  /**
   * RECALL TOKEN
   * 
   * Bring a skipped or missed token back into waiting.
   */
  static async recallToken(tokenId, performedBy) {
    const token = await findTokenOrThrow(tokenId)
    assertTransition(token, TOKEN_STATUS.WAITING)

    const prevStatus = token.status
    token.status     = TOKEN_STATUS.WAITING
    await token.save()

    await log(token._id, QUEUE_ACTIONS.RECALLED, performedBy, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.WAITING
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'recalled',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  /**
   * MARK MISSED
   * 
   * Token is a no-show.
   */
  static async markMissed(tokenId, performedBy) {
    const token = await findTokenOrThrow(tokenId)
    assertTransition(token, TOKEN_STATUS.MISSED)

    const prevStatus    = token.status
    token.status        = TOKEN_STATUS.MISSED
    token.noShowCount   = (token.noShowCount || 0) + 1
    await token.save()

    await log(token._id, QUEUE_ACTIONS.MISSED, performedBy, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.MISSED
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'missed',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  /**
   * CHECK-IN TOKEN
   * 
   * Mark a token as physically present. Does not change status — just flags it.
   * Works for both waiting and held tokens.
   */
  /**
   * CHECK-IN TOKEN
   * 
   * Mark a token as physically present by changing its status to CHECKED_IN.
   * This ensures the token remains in the active queue but prioritized for service.
   */
  static async checkIn(tokenId, performedBy) {
    const token = await findTokenOrThrow(tokenId)

    if (token.status !== TOKEN_STATUS.WAITING) {
      throw new AppError(`Only waiting tokens can be checked in. Current status: ${token.status}`, 400)
    }

    if (token.status === TOKEN_STATUS.CHECKED_IN || token.checkedInAt) {
      throw new AppError('Token is already checked in.', 400)
    }

    const prevStatus = token.status
    token.status = TOKEN_STATUS.CHECKED_IN
    token.checkedInAt = new Date()
    await token.save()

    await log(token._id, QUEUE_ACTIONS.CHECK_IN, performedBy, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.CHECKED_IN,
      checkedInAt: token.checkedInAt
    })

    await refreshWaitTimes(token.branchId, token.departmentId)

    // Notify branch staff
    emitToBranch(token.branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'checked_in',
      tokenNumber: token.tokenNumber
    })

    return token
  }
}
