'use strict';

// Central place for configuration. Values are read lazily (on every call) so automated tests can set process.env before the app is created.
function getConfig() {
  return {
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event_management',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    adminSignupCode: process.env.ADMIN_SIGNUP_CODE || '',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    trustProxy: process.env.TRUST_PROXY === '1',
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  };
}

// Fail fast at start-up instead of failing on the first login.
function assertConfig() {
  const { jwtSecret } = getConfig();
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
}

module.exports = { getConfig, assertConfig };
