module.exports = {
  testEnvironment: 'node',
  testTimeout: 20000,
  setupFiles: ['<rootDir>/tests/helpers/setEnv.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/seed/**'],
  coverageReporters: ['text-summary', 'lcov'],
};
