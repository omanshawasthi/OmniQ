export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  OPERATOR: 'operator',
  ADMIN: 'admin'
};

export const TOKEN_STATUS = {
  WAITING: 'waiting',
  SERVING: 'serving',
  HELD: 'held',
  SKIPPED: 'skipped',
  COMPLETED: 'completed',
  MISSED: 'missed',
  CANCELLED: 'cancelled'
};

export const TOKEN_PRIORITY = {
  NORMAL: 'normal',
  HIGH: 'high'
};

export const BOOKING_TYPE = {
  ONLINE: 'online',
  WALK_IN: 'walk-in'
};

export const COUNTER_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  OFFLINE: 'offline'
};

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  TOKEN_APPROACHING: 'token_approaching',
  MISSED_TOKEN: 'missed_token',
  TOKEN_CANCELLED: 'token_cancelled',
  QUEUE_DELAYED: 'queue_delayed',
  TOKEN_COMPLETED: 'token_completed',
  TOKEN_EXPIRED: 'token_expired'
};

export const QUEUE_ACTIONS = {
  CREATED: 'created',
  CALLED: 'called',
  SERVING: 'serving',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  HELD: 'held',
  MISSED: 'missed',
  CANCELLED: 'cancelled',
  RECALLED: 'recalled',
  CHECKED_IN: 'checked-in'
};

export const SOCKET_EVENTS = {
  // Client to Server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  QUEUE_ACTION: 'queue_action',
  
  // Server to Client
  TOKEN_STATUS_CHANGED: 'token_status_changed',
  QUEUE_UPDATED: 'queue_updated',
  TOKEN_CALLED: 'token_called',
  NOTIFICATION: 'notification',
  PUBLIC_DISPLAY_UPDATE: 'public_display_update',
  COUNTER_STATUS_CHANGED: 'counter_status_changed'
};

export const ROOM_TYPES = {
  BRANCH: 'branch_',
  DEPARTMENT: 'department_',
  COUNTER: 'counter_',
  USER: 'user_',
  PUBLIC_DISPLAY: 'public_display_'
};

export const VALID_TOKEN_TRANSITIONS = {
  [TOKEN_STATUS.WAITING]: [
    TOKEN_STATUS.SERVING,
    TOKEN_STATUS.HELD,
    TOKEN_STATUS.SKIPPED,
    TOKEN_STATUS.MISSED,
    TOKEN_STATUS.CANCELLED
  ],
  [TOKEN_STATUS.SERVING]: [
    TOKEN_STATUS.COMPLETED,
    TOKEN_STATUS.HELD,
    TOKEN_STATUS.SKIPPED
  ],
  [TOKEN_STATUS.HELD]: [
    TOKEN_STATUS.WAITING,
    TOKEN_STATUS.SERVING,
    TOKEN_STATUS.CANCELLED
  ],
  [TOKEN_STATUS.SKIPPED]: [
    TOKEN_STATUS.WAITING,
    TOKEN_STATUS.MISSED,
    TOKEN_STATUS.CANCELLED
  ],
  [TOKEN_STATUS.MISSED]: [
    TOKEN_STATUS.WAITING,
    TOKEN_STATUS.CANCELLED
  ],
  [TOKEN_STATUS.COMPLETED]: [],
  [TOKEN_STATUS.CANCELLED]: []
};

export const PERMISSIONS = {
  // Token permissions
  BOOK_TOKEN: 'book_token',
  VIEW_QUEUE_STATUS: 'view_queue_status',
  CREATE_WALK_IN: 'create_walk_in',
  CONTROL_QUEUE: 'control_queue',
  
  // Management permissions
  MANAGE_BRANCHES: 'manage_branches',
  MANAGE_DEPARTMENTS: 'manage_departments',
  MANAGE_COUNTERS: 'manage_counters',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  
  // System permissions
  VIEW_LOGS: 'view_logs',
  SYSTEM_CONFIG: 'system_config'
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.BOOK_TOKEN,
    PERMISSIONS.VIEW_QUEUE_STATUS
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.BOOK_TOKEN,
    PERMISSIONS.VIEW_QUEUE_STATUS,
    PERMISSIONS.CREATE_WALK_IN,
    PERMISSIONS.CONTROL_QUEUE
  ],
  [ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_QUEUE_STATUS,
    PERMISSIONS.CONTROL_QUEUE
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS)
};
