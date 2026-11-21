'use strict';
const { Server } = require('socket.io');
const { getConfig } = require('../config/env');
const { verifyToken } = require('../services/authService');

// Real-time layer (Socket.IO over WebSocket).
// Controllers call emit() after a change; every connected, logged-in client receives it.
// emit() does nothing until init() has run, so the REST API also works without sockets.
let io = null;

function broadcastPresence() {
  if (io) io.emit('presence', { online: io.of('/').sockets.size });
}

function init(httpServer) {
  io = new Server(httpServer, { cors: { origin: getConfig().corsOrigin } });

  // Only logged-in users may connect: the JWT is sent in the handshake.
  io.use((socket, next) => {
    try {
      const payload = verifyToken(socket.handshake.auth && socket.handshake.auth.token);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    broadcastPresence();
    socket.on('disconnect', broadcastPresence);
  });
  return io;
}

function emit(eventName, payload) {
  if (io) io.emit(eventName, payload);
}

function close() {
  return new Promise((resolve) => {
    if (!io) return resolve();
    const server = io;
    io = null;
    return server.close(() => resolve());
  });
}

module.exports = { init, emit, close };
