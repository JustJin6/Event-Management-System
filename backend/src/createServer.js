'use strict';
const http = require('node:http');
const { createApp } = require('./app');
const realtime = require('./sockets/realtime');

// Builds the HTTP server with Express and Socket.IO attached (shared by server.js and the tests).
function createHttpServer() {
  const server = http.createServer(createApp());
  realtime.init(server);
  return server;
}

module.exports = { createHttpServer };
