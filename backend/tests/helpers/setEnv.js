// Runs before every test file (see jest.config.js).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_SIGNUP_CODE = 'TEST-ADMIN';
process.env.AUTH_RATE_LIMIT_MAX = '100000';
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/event_management_test';
