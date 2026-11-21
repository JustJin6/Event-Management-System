const request = require('supertest');

let counter = 0;

// A date `days` days from now as an ISO string.
const futureDate = (days = 7) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

async function createUser(app, { admin = false } = {}) {
  counter += 1;
  const body = {
    name: `Test User ${counter}`,
    email: `user${counter}@example.com`,
    password: 'Password123!',
  };
  if (admin) body.adminCode = process.env.ADMIN_SIGNUP_CODE;
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`Could not create test user: ${res.status} ${res.text}`);
  return { token: res.body.token, user: res.body.user, email: body.email, password: body.password };
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const eventBody = (overrides = {}) => ({
  title: 'Test Workshop',
  description: 'A workshop used by the automated tests.',
  date: futureDate(7),
  venue: 'Room 101',
  capacity: 10,
  ...overrides,
});

async function createEvent(app, adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/events')
    .set(authHeader(adminToken))
    .send(eventBody(overrides));
  if (res.status !== 201) throw new Error(`Could not create test event: ${res.status} ${res.text}`);
  return res.body;
}

module.exports = { futureDate, createUser, authHeader, eventBody, createEvent };
