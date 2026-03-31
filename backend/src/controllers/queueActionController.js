import { QueueLifecycleService } from '../services/queueLifecycleService.js'

// ─── Call Next ────────────────────────────────────────────────────────────────
export const callNext = async (req, res, next) => {
  try {
    const { branchId, departmentId, counterId } = req.body
    const token = await QueueLifecycleService.callNext(req.user._id, {
      branchId: branchId || req.user.branchId,
      departmentId,
      counterId
    })
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Serve specific token ─────────────────────────────────────────────────────
export const serveToken = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.serveToken(
      req.params.tokenId,
      req.user._id,
      { counterId: req.body.counterId }
    )
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Complete ─────────────────────────────────────────────────────────────────
export const completeToken = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.completeToken(req.params.tokenId, req.user._id)
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Skip ─────────────────────────────────────────────────────────────────────
export const skipToken = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.skipToken(
      req.params.tokenId,
      req.user._id,
      req.body.reason || ''
    )
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Hold ─────────────────────────────────────────────────────────────────────
export const holdToken = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.holdToken(
      req.params.tokenId,
      req.user._id,
      req.body.reason || ''
    )
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Recall ───────────────────────────────────────────────────────────────────
export const recallToken = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.recallToken(req.params.tokenId, req.user._id)
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Missed ───────────────────────────────────────────────────────────────────
export const markMissed = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.markMissed(req.params.tokenId, req.user._id)
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}

// ─── Check-in ─────────────────────────────────────────────────────────────────
export const checkIn = async (req, res, next) => {
  try {
    const token = await QueueLifecycleService.checkIn(req.params.tokenId, req.user._id)
    res.status(200).json({ success: true, data: token })
  } catch (err) { next(err) }
}
