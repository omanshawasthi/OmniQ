// Token Status / States
export const TOKEN_STATUS = {
  WAITING: 'waiting',
  SERVING: 'serving',
  HELD: 'held',
  SKIPPED: 'skipped',
  COMPLETED: 'completed',
  MISSED: 'missed',
  CANCELLED: 'cancelled'
};

// Socket.IO Room Types
export const ROOM_TYPES = {
  BRANCH: 'branch_',
  DEPARTMENT: 'dept_',
  COUNTER: 'counter_',
  USER: 'user_',
  PUBLIC_DISPLAY: 'display_'
};

// Socket.IO Events
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  QUEUE_UPDATED: 'queue_updated',
  TOKEN_CALLED: 'token_called',
  TOKEN_STATUS_CHANGED: 'token_status_changed',
  PUBLIC_DISPLAY_UPDATE: 'display_update',
  NOTIFICATION: 'notification',
  QUEUE_ACTION: 'queue_action'
};
