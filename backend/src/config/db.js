'use strict';
const mongoose = require('mongoose');
const os = require('os'); // Import the 'os' module to access operating system-related utility methods and properties.

async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  // Workaround for MongoDB Node.js driver 7.6+ compatibility issue with Jest.
  // Explicitly provide the OS module to prevent client metadata initialization errors.
  // Reference: MongoDB NODE-7832.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, runtimeAdapters: { os: os } });
  return mongoose.connection;
}

async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
