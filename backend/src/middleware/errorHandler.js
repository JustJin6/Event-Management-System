'use strict';
const AppError = require('../utils/AppError');

function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

// Express recognises error handlers by their four parameters.
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = { message: err.message };
    if (err.details) body.errors = err.details;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
