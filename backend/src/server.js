'use strict';
const { getConfig, assertConfig } = require('./config/env');
const { connectDb, disconnectDb } = require('./config/db');
const { createHttpServer } = require('./createServer');

// Local runs: read backend/.env if it exists (built into Node, no extra package).
try {
  process.loadEnvFile();
} catch {
  // No .env file - use the real environment (Docker, CI)
}

async function main() {
  assertConfig();
  const { port, mongoUri } = getConfig();
  await connectDb(mongoUri);
  console.log('Connected to MongoDB');

  const server = createHttpServer();
  server.listen(port, () => console.log(`API listening on port ${port}`));

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
