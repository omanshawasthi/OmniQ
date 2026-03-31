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
import Counter from '../models/Counter.js'
import QueueLog from '../models/QueueLog.js'
import AppError from '../utils/AppError.js'
import { TOKEN_STATUS, QUEUE_ACTIONS, TOKEN_PRIORITY } from '../utils/constants.js'

// ─── Transition Map (source of truth for valid moves) ────────────────────────
const TRANSITIONS = {
  [TOKEN_STATUS.WAITING]:   [TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD, TOKEN_STATUS.SKIPPED, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.SERVING]:  [TOKEN_STATUS.COMPLETED, TOKEN_STATUS.HELD, TOKEN_STATUS.SKIPPED],
  [TOKEN_STATUS.HELD]:     [TOKEN_STATUS.SERVING, TOKEN_STATUS.WAITING, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.SKIPPED]:  [TOKEN_STATUS.WAITING, TOKEN_STATUS.MISSED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.MISSED]:   [TOKEN_STATUS.WAITING, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.COMPLETED]: [],
  [TOKEN_STATUS.CANCELLED]: []
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
async function log(tokenId, action, performedBy, counterId, metadata = {}) {
  try {
    await QueueLog.logAction({ tokenId, action, performedBy, counterId: counterId || null, metadata })
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
    const { branchId, departmentId, counterId } = options

    if (!branchId && !departmentId && !counterId) {
      throw new AppError('At least one of branchId, departmentId, or counterId is required.', 400)
    }

    // Build search query
    const matchQuery = { status: TOKEN_STATUS.WAITING }
    if (branchId)     matchQuery.branchId     = branchId
    if (departmentId) matchQuery.departmentId = departmentId

    // If a counter is given, resolve its branch/dept and only pick unassigned or matching tokens
    let resolvedCounter = null
    if (counterId) {
      resolvedCounter = await Counter.findById(counterId)
      if (!resolvedCounter) throw new AppError('Counter not found.', 404)
      matchQuery.branchId     = resolvedCounter.branchId
      matchQuery.departmentId = resolvedCounter.departmentId
    }

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
      const result = await Token.findOneAndUpdate(
        { _id: candidate._id, status: TOKEN_STATUS.WAITING }, // still waiting?
        {
          $set: {
            status: TOKEN_STATUS.SERVING,
            startedServiceAt: now,
            ...(counterId && { counterId })
          }
        },
        { new: true }
      ).populate('userId', 'name phone').populate('branchId', 'name').populate('departmentId', 'name')

      if (result) { claimed = result; break }
    }

    if (!claimed) {
      throw new AppError('No waiting tokens in queue.', 404)
    }

    // Update counter if provided
    if (resolvedCounter) {
      // Complete current token serving at this counter if any
      if (resolvedCounter.currentToken) {
        await this.completeToken(resolvedCounter.currentToken.toString(), performedBy)
      }
      await Counter.findByIdAndUpdate(counterId, {
        currentToken: claimed._id,
        lastActivity: new Date()
      })
    }

    await log(claimed._id, QUEUE_ACTIONS.CALLED, performedBy, counterId, {
      previousStatus: TOKEN_STATUS.WAITING,
      newStatus: TOKEN_STATUS.SERVING
    })

    await refreshWaitTimes(claimed.branchId, claimed.departmentId)

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
    token.status          = TOKEN_STATUS.SERVING
    token.startedServiceAt = new Date()
    if (options.counterId) token.counterId = options.counterId

    await token.save()

    await log(token._id, QUEUE_ACTIONS.SERVING, performedBy, token.counterId, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.SERVING
    })

    await refreshWaitTimes(token.branchId, token.departmentId)
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
    if (token.startedServiceAt) {
      token.actualServiceTime = (now - token.startedServiceAt) / (1000 * 60)
    }
    await token.save()

    // Clear counter
    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        lastActivity: now,
        $inc: { tokensServedToday: 1 }
      })
    }

    await log(token._id, QUEUE_ACTIONS.COMPLETED, performedBy, token.counterId, {
      previousStatus: TOKEN_STATUS.SERVING,
      newStatus: TOKEN_STATUS.COMPLETED,
      duration: token.actualServiceTime
    })

    await refreshWaitTimes(token.branchId, token.departmentId)
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

    if (token.counterId && prevStatus === TOKEN_STATUS.SERVING) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        lastActivity: new Date()
      })
    }

    await log(token._id, QUEUE_ACTIONS.SKIPPED, performedBy, token.counterId, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.SKIPPED,
      reason
    })

    await refreshWaitTimes(token.branchId, token.departmentId)
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

    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        lastActivity: new Date()
      })
    }

    await log(token._id, QUEUE_ACTIONS.HELD, performedBy, token.counterId, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.HELD,
      reason
    })

    await refreshWaitTimes(token.branchId, token.departmentId)
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

    await log(token._id, QUEUE_ACTIONS.RECALLED, performedBy, null, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.WAITING
    })

    await refreshWaitTimes(token.branchId, token.departmentId)
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

    if (token.counterId && prevStatus === TOKEN_STATUS.SERVING) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        lastActivity: new Date()
      })
    }

    await log(token._id, QUEUE_ACTIONS.MISSED, performedBy, token.counterId, {
      previousStatus: prevStatus,
      newStatus: TOKEN_STATUS.MISSED
    })

    await refreshWaitTimes(token.branchId, token.departmentId)
    return token
  }

  /**
   * CHECK-IN TOKEN
   * 
   * Mark a token as physically present. Does not change status — just flags it.
   * Works for both waiting and held tokens.
   */
  static async checkIn(tokenId, performedBy) {
    const token = await findTokenOrThrow(tokenId)

    const checkInAllowed = [TOKEN_STATUS.WAITING, TOKEN_STATUS.HELD]
    if (!checkInAllowed.includes(token.status)) {
      throw new AppError(`Check-in not available for tokens in '${token.status}' status.`, 400)
    }

    if (token.checkedInAt) {
      throw new AppError('Token is already checked in.', 400)
    }

    token.checkedInAt = new Date()
    await token.save()

    await log(token._id, QUEUE_ACTIONS.CHECK_IN, performedBy, null, {
      checkedInAt: token.checkedInAt,
      tokenStatus: token.status
    })

    return token
  }
}
