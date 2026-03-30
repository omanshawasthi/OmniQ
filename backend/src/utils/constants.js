// User Roles
export const USER_ROLES = {
  USER: 'USER',
  STAFF: 'STAFF',
  OPERATOR: 'OPERATOR',
  ADMIN: 'ADMIN'
};

// Also export ROLES for backward compatibility in some src components
export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  OPERATOR: 'operator',
  ADMIN: 'admin'
};

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

// Alias for compatibility
export const TOKEN_STATES = TOKEN_STATUS;

// Token Priority
export const TOKEN_PRIORITY = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Booking Types
export const BOOKING_TYPE = {
  WALK_IN: 'walk-in',
  ONLINE: 'online',
  APPOINTMENT: 'appointment'
};

// Counter Status
export const COUNTER_STATUS = {
  OFFLINE: 'offline',
  ACTIVE: 'active',
  PAUSED: 'paused',
  INACTIVE: 'inactive'
};

// User Permissions
export const PERMISSIONS = {
  BOOK_TOKEN: 'book_token',
  VIEW_QUEUE_STATUS: 'view_queue_status',
  CREATE_WALK_IN: 'create_walk_in',
  CONTROL_QUEUE: 'control_queue',
  MANAGE_BRANCHES: 'manage_branches',
  MANAGE_DEPARTMENTS: 'manage_departments',
  MANAGE_COUNTERS: 'manage_counters',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics'
};

// Role-based Permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: [
    PERMISSIONS.BOOK_TOKEN,
    PERMISSIONS.VIEW_QUEUE_STATUS
  ],
  [USER_ROLES.STAFF]: [
    PERMISSIONS.BOOK_TOKEN,
    PERMISSIONS.VIEW_QUEUE_STATUS,
    PERMISSIONS.CREATE_WALK_IN,
    PERMISSIONS.CONTROL_QUEUE
  ],
  [USER_ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_QUEUE_STATUS,
    PERMISSIONS.CONTROL_QUEUE
  ],
  [USER_ROLES.ADMIN]: ['*'] // Full access
};

// Also add lowercase versions for secondary components using mixed logic
ROLE_PERMISSIONS['user'] = ROLE_PERMISSIONS[USER_ROLES.USER];
ROLE_PERMISSIONS['staff'] = ROLE_PERMISSIONS[USER_ROLES.STAFF];
ROLE_PERMISSIONS['operator'] = ROLE_PERMISSIONS[USER_ROLES.OPERATOR];
ROLE_PERMISSIONS['admin'] = ROLE_PERMISSIONS[USER_ROLES.ADMIN];

// Valid State Transitions
export const VALID_TRANSITIONS = {
  [TOKEN_STATUS.WAITING]: [
    TOKEN_STATUS.SERVING,
    TOKEN_STATUS.SKIPPED,
    TOKEN_STATUS.MISSED,
    TOKEN_STATUS.CANCELLED,
    TOKEN_STATUS.HELD
  ],
  [TOKEN_STATUS.SERVING]: [
    TOKEN_STATUS.COMPLETED,
    TOKEN_STATUS.HELD
  ],
  [TOKEN_STATUS.HELD]: [
    TOKEN_STATUS.WAITING,
    TOKEN_STATUS.SERVING,
    TOKEN_STATUS.CANCELLED
  ],
  [TOKEN_STATUS.SKIPPED]: [
    TOKEN_STATUS.WAITING,
    TOKEN_STATUS.CANCELLED
  ],
  [TOKEN_STATUS.COMPLETED]: [], 
  [TOKEN_STATUS.MISSED]: [], 
  [TOKEN_STATUS.CANCELLED]: [] 
};

// Queue Settings
export const QUEUE_SETTINGS = {
  TOKEN_EXPIRY_MINUTES: 30,
  NO_SHOW_MINUTES: 15,
  MAX_QUEUE_SIZE: 100,
  RECALL_TIMEOUT_MINUTES: 5
};

// Queue Actions
export const QUEUE_ACTIONS = {
  CREATED: 'CREATED',
  BOOKED: 'BOOKED',
  CALLED: 'CALLED',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  MISSED: 'MISSED',
  HELD: 'HELD',
  SKIPPED: 'SKIPPED',
  RECALLED: 'RECALLED',
  TRANSFER: 'TRANSFER',
  CHECK_IN: 'CHECK_IN'
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
