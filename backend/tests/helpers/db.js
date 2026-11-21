const mongoose = require('mongoose');
const { connectDb, disconnectDb } = require('../../src/config/db');
require('../../src/models/User');
require('../../src/models/Event');
require('../../src/models/Registration');

function assertTestDatabase() {
  // Safety net: these helpers delete data, so refuse to run against anything not named "test".
  if (!/test/i.test(process.env.MONGODB_URI)) {
    throw new Error('Refusing to run tests against a database whose name does not contain "test"');
  }
}

async function connect() {
  assertTestDatabase();
  await connectDb(process.env.MONGODB_URI);
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

async function clear() {
  assertTestDatabase();
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
}

module.exports = { connect, clear, disconnect: disconnectDb };
