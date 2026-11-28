'use strict';
// Fills the database with demo data:  npm run seed  (WARNING: clears users, events and registrations)
const bcrypt = require('bcryptjs');
const { getConfig } = require('../config/env');
const { connectDb, disconnectDb } = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

try {
  process.loadEnvFile();
} catch {
  // No .env file - use the real environment
}

const DAY = 24 * 60 * 60 * 1000;
const inDays = (days, hour) => {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function seed() {
  await connectDb(getConfig().mongoUri);
  await Promise.all([User.deleteMany({}), Event.deleteMany({}), Registration.deleteMany({})]);

  const hash = (password) => bcrypt.hash(password, 10);
  const [admin, alice] = await User.create([
    { name: 'Demo Admin', email: 'admin@example.com', passwordHash: await hash('Admin123!'), role: 'admin' },
    { name: 'Alice Tan', email: 'alice@example.com', passwordHash: await hash('Participant123!'), role: 'participant' },
    { name: 'Bob Lee', email: 'bob@example.com', passwordHash: await hash('Participant123!'), role: 'participant' },
  ]);

  const events = await Event.create([
    { title: 'Intro to Web Development', description: 'A hands-on workshop covering HTML, CSS and JavaScript basics.', date: inDays(20, 10), venue: 'Lab 3, Block B', capacity: 30 },
    { title: 'Cyber Security Awareness Talk', description: 'Learn how to spot phishing and protect your accounts.', date: inDays(23, 14), venue: 'Main Auditorium', capacity: 75 },
    { title: 'Hackathon Kick-off', description: 'Meet your team and receive the challenge brief.', date: inDays(34, 9), venue: 'Innovation Hub', capacity: 20 },
    { title: 'Career Fair', description: 'Meet employers and learn about internships.', date: inDays(41, 11), venue: 'Sports Hall', capacity: 100 },
  ]);

  await Registration.create({ userId: alice._id, eventId: events[2]._id });

  console.log('Seed complete. Demo logins:');
  console.log(`  Admin:       ${admin.email} / Admin123!`);
  console.log('  Participant: alice@example.com / Participant123!');
  console.log('  Participant: bob@example.com / Participant123!');
  await disconnectDb();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await disconnectDb();
  process.exit(1);
});
