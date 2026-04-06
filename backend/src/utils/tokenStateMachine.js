import { TOKEN_STATUS, VALID_TOKEN_TRANSITIONS } from './constants.js'
import QueueLog from '../models/QueueLog.js'

export class TokenStateMachine {
  constructor(token) {
    this.token = token
    this.currentState = token.status
  }

  // Check if transition is valid
  canTransitionTo(newState) {
    const validTransitions = VALID_TOKEN_TRANSITIONS[this.currentState] || []
    return validTransitions.includes(newState)
  }

  // Get valid transitions for current state
  getValidTransitions() {
    return VALID_TOKEN_TRANSITIONS[this.currentState] || []
  }

  // Execute state transition
  async transition(newState, performedBy, reason = '', metadata = {}) {
    if (!this.canTransitionTo(newState)) {
      throw new Error(`Invalid state transition from ${this.currentState} to ${newState}`)
    }

    const oldState = this.currentState
    const timestamp = new Date()

    // Update token state
    this.token.status = newState

    // Update timestamps based on state
    switch (newState) {
      case TOKEN_STATUS.SERVING:
        this.token.startedServiceAt = timestamp
        break
      case TOKEN_STATUS.COMPLETED:
        this.token.completedAt = timestamp
        if (this.token.startedServiceAt) {
          this.token.actualServiceTime = (timestamp - this.token.startedServiceAt) / (1000 * 60) // in minutes
        }
        break
      case TOKEN_STATUS.MISSED:
        this.token.noShowCount = (this.token.noShowCount || 0) + 1
        break
    }

    // Log the transition
    await QueueLog.logAction({
      tokenId: this.token._id,
      action: this.getActionForTransition(newState),
      performedBy,
      timestamp,
      metadata: {
        previousStatus: oldState,
        newStatus: newState,
        reason,
        serviceTime: this.token.actualServiceTime,
        ...metadata
      }
    })

    this.currentState = newState

    return {
      oldState,
      newState,
      timestamp,
      performedBy,
      reason
    }
  }

  // Get action name for transition
  getActionForTransition(newState) {
    const actionMap = {
      [TOKEN_STATUS.WAITING]: 'created',
      [TOKEN_STATUS.SERVING]: 'serving',
      [TOKEN_STATUS.HELD]: 'held',
      [TOKEN_STATUS.SKIPPED]: 'skipped',
      [TOKEN_STATUS.COMPLETED]: 'completed',
      [TOKEN_STATUS.MISSED]: 'missed',
      [TOKEN_STATUS.CANCELLED]: 'cancelled'
    }
    return actionMap[newState] || 'status_changed'
  }

  // Check if token is expired
  isExpired() {
    if (this.currentState !== TOKEN_STATUS.WAITING) {
      return false
    }

    const now = new Date()
    const scheduledTime = new Date(this.token.scheduledTime)
    const expiryTime = new Date(scheduledTime.getTime() + (30 * 60 * 1000)) // 30 minutes grace period
    
    return now > expiryTime
  }

  // Check if token can be cancelled
  canBeCancelled() {
    if (this.currentState === TOKEN_STATUS.COMPLETED || 
        this.currentState === TOKEN_STATUS.CANCELLED) {
      return false
    }

    const now = new Date()
    const scheduledTime = new Date(this.token.scheduledTime)
    const cutoffTime = new Date(scheduledTime.getTime() - (30 * 60 * 1000)) // 30 minutes before
    
    return now < cutoffTime
  }

  // Get next logical state
  getNextLogicalState() {
    switch (this.currentState) {
      case TOKEN_STATUS.WAITING:
        return TOKEN_STATUS.SERVING
      case TOKEN_STATUS.SERVING:
        return TOKEN_STATUS.COMPLETED
      case TOKEN_STATUS.HELD:
        return TOKEN_STATUS.WAITING
      case TOKEN_STATUS.SKIPPED:
        return TOKEN_STATUS.WAITING
      case TOKEN_STATUS.MISSED:
        return TOKEN_STATUS.WAITING
      default:
        return null
    }
  }

  // Get state description
  getStateDescription() {
    const descriptions = {
      [TOKEN_STATUS.WAITING]: 'Token is waiting to be called',
      [TOKEN_STATUS.SERVING]: 'Token is currently being served',
      [TOKEN_STATUS.HELD]: 'Token is temporarily on hold',
      [TOKEN_STATUS.SKIPPED]: 'Token was skipped and can be recalled',
      [TOKEN_STATUS.COMPLETED]: 'Token service has been completed',
      [TOKEN_STATUS.MISSED]: 'Token was missed by the customer',
      [TOKEN_STATUS.CANCELLED]: 'Token was cancelled'
    }
    return descriptions[this.currentState] || 'Unknown state'
  }

  // Get state color for UI
  getStateColor() {
    const colors = {
      [TOKEN_STATUS.WAITING]: 'yellow',
      [TOKEN_STATUS.SERVING]: 'blue',
      [TOKEN_STATUS.HELD]: 'orange',
      [TOKEN_STATUS.SKIPPED]: 'gray',
      [TOKEN_STATUS.COMPLETED]: 'green',
      [TOKEN_STATUS.MISSED]: 'red',
      [TOKEN_STATUS.CANCELLED]: 'gray'
    }
    return colors[this.currentState] || 'gray'
  }

  // Check if token is in final state
  isFinalState() {
    return [TOKEN_STATUS.COMPLETED, TOKEN_STATUS.CANCELLED].includes(this.currentState)
  }

  // Check if token is active
  isActive() {
    return [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD].includes(this.currentState)
  }

  // Get time in current state
  getTimeInCurrentState() {
    // This would need to be calculated based on when the state was entered
    // For now, return a placeholder
    return Date.now() - this.token.updatedAt
  }

  // Validate token state consistency
  validateState() {
    const errors = []

    // Check if current state is valid
    if (!Object.values(TOKEN_STATUS).includes(this.currentState)) {
      errors.push(`Invalid state: ${this.currentState}`)
    }

    // Check timestamp consistency
    if (this.token.startedServiceAt && this.currentState === TOKEN_STATUS.WAITING) {
      errors.push('Token has startedServiceAt but is in waiting state')
    }

    if (this.token.completedAt && this.currentState !== TOKEN_STATUS.COMPLETED) {
      errors.push('Token has completedAt but is not in completed state')
    }

    // Check service time consistency
    if (this.token.actualServiceTime && !this.token.startedServiceAt) {
      errors.push('Token has actualServiceTime but no startedServiceAt')
    }

    return errors
  }

  // Get state transition history
  async getTransitionHistory() {
    return await QueueLog.getTokenHistory(this.token._id)
  }

  // Create a new state machine instance
  static create(token) {
    return new TokenStateMachine(token)
  }
}

// Utility functions for token state management
export const TokenStateUtils = {
  // Check if multiple tokens can be processed simultaneously
  canProcessMultiple(tokens) {
    // Only allow multiple processing if they're in different departments/branches
    const departments = new Set(tokens.map(t => t.departmentId?.toString()))
    const branches = new Set(tokens.map(t => t.branchId?.toString()))
    
    return departments.size === tokens.length || branches.size === tokens.length
  },

  // Get priority order for tokens
  getPriorityOrder(tokens) {
    return tokens.sort((a, b) => {
      // High priority first
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (b.priority === 'high' && a.priority !== 'high') return 1
      
      // Then by scheduled time (earlier first)
      const aTime = new Date(a.scheduledTime).getTime()
      const bTime = new Date(b.scheduledTime).getTime()
      return aTime - bTime
    })
  },

  // Check if token should be auto-expired
  shouldAutoExpire(token, gracePeriodMinutes = 30) {
    if (token.status !== TOKEN_STATUS.WAITING) {
      return false
    }

    const now = new Date()
    const scheduledTime = new Date(token.scheduledTime)
    const expiryTime = new Date(scheduledTime.getTime() + (gracePeriodMinutes * 60 * 1000))
    
    return now > expiryTime
  },

  // Get recommended action for token
  getRecommendedAction(token) {
    const stateMachine = TokenStateMachine.create(token)
    
    if (stateMachine.isExpired()) {
      return {
        action: 'expire',
        reason: 'Token has expired',
        priority: 'high'
      }
    }

    if (stateMachine.canBeCancelled() && token.noShowCount > 2) {
      return {
        action: 'block',
        reason: 'User has multiple no-shows',
        priority: 'medium'
      }
    }

    if (token.estimatedWaitTime > 60) {
      return {
        action: 'notify_delay',
        reason: 'Long wait time',
        priority: 'medium'
      }
    }

    return {
      action: 'none',
      reason: 'No action needed',
      priority: 'low'
    }
  }
}

export default TokenStateMachine
