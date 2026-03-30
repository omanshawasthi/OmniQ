import logger from '../config/logger.js';

export const initializeSocket = (io) => {
  logger.info('Socket.IO server initialized');

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room based on branch/department
    socket.on('join-queue', (data) => {
      const { branchId, departmentId } = data;
      const room = departmentId ? `${branchId}-${departmentId}` : branchId;
      socket.join(room);
      logger.info(`Client ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave-queue', (data) => {
      const { branchId, departmentId } = data;
      const room = departmentId ? `${branchId}-${departmentId}` : branchId;
      socket.leave(room);
      logger.info(`Client ${socket.id} left room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Export io for use in controllers
  global.io = io;
};
