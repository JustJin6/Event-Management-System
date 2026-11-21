const request = require('supertest');
const db = require('../helpers/db');
const Registration = require('../../src/models/Registration');
const { createApp } = require('../../src/app');
const { createUser, authHeader, createEvent } = require('../helpers/api');

const app = createApp();
let admin;
let participant;

const register = (token, eventId) =>
  request(app).post(`/api/events/${eventId}/register`).set(authHeader(token));
const cancel = (token, eventId) =>
  request(app).delete(`/api/events/${eventId}/register`).set(authHeader(token));

beforeAll(db.connect);
beforeEach(async () => {
  await db.clear();
  admin = await createUser(app, { admin: true });
  participant = await createUser(app);
});
afterAll(db.disconnect);

describe('registering', () => {
  it('registers a participant and reduces the available seats', async () => {
    const event = await createEvent(app, admin.token, { capacity: 3 });
    const res = await register(participant.token, event.eventId);
    expect(res.status).toBe(201);
    expect(res.body.registration.status).toBe('registered');
    expect(res.body.seats).toMatchObject({ registeredCount: 1, seatsAvailable: 2 });

    const fetched = await request(app).get(`/api/events/${event.eventId}`).set(authHeader(admin.token));
    expect(fetched.body.seatsAvailable).toBe(2);
  });

  it('rejects a duplicate registration (409)', async () => {
    const event = await createEvent(app, admin.token);
    await register(participant.token, event.eventId);
    expect((await register(participant.token, event.eventId)).status).toBe(409);
  });

  it('rejects registration when the event is full (409)', async () => {
    const event = await createEvent(app, admin.token, { capacity: 1 });
    await register(participant.token, event.eventId);
    const second = await createUser(app);
    const res = await register(second.token, event.eventId);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/full/i);
  });

  it('forbids admins from registering (403) and requires login (401)', async () => {
    const event = await createEvent(app, admin.token);
    expect((await register(admin.token, event.eventId)).status).toBe(403);
    expect((await request(app).post(`/api/events/${event.eventId}/register`)).status).toBe(401);
  });

  it('returns 404 for an unknown event', async () => {
    expect((await register(participant.token, 'f'.repeat(24))).status).toBe(404);
  });

  it('never sells more seats than the capacity when many people register at once', async () => {
    const event = await createEvent(app, admin.token, { capacity: 1 });
    const users = await Promise.all([1, 2, 3, 4, 5].map(() => createUser(app)));

    const results = await Promise.all(users.map((u) => register(u.token, event.eventId)));

    const successes = results.filter((r) => r.status === 201).length;
    const stored = await Registration.countDocuments({ eventId: event.eventId, status: 'registered' });
    expect(successes).toBeLessThanOrEqual(1);
    expect(stored).toBe(successes);
  });
});

describe('cancelling', () => {
  it('cancels and frees the seat', async () => {
    const event = await createEvent(app, admin.token, { capacity: 2 });
    await register(participant.token, event.eventId);
    const res = await cancel(participant.token, event.eventId);
    expect(res.status).toBe(200);
    expect(res.body.registration.status).toBe('cancelled');
    expect(res.body.seats.seatsAvailable).toBe(2);
  });

  it('returns 404 when not registered', async () => {
    const event = await createEvent(app, admin.token);
    expect((await cancel(participant.token, event.eventId)).status).toBe(404);
  });

  it('lets the participant register again after cancelling', async () => {
    const event = await createEvent(app, admin.token);
    await register(participant.token, event.eventId);
    await cancel(participant.token, event.eventId);
    const again = await register(participant.token, event.eventId);
    expect(again.status).toBe(201);
    expect(await Registration.countDocuments({ eventId: event.eventId })).toBe(1);
  });
});

describe('viewing registrations', () => {
  it('shows a participant only their own active registrations, with event details', async () => {
    const first = await createEvent(app, admin.token, { title: 'First event' });
    const second = await createEvent(app, admin.token, { title: 'Second event' });
    const other = await createUser(app);
    await register(participant.token, first.eventId);
    await register(participant.token, second.eventId);
    await register(other.token, first.eventId);
    await cancel(participant.token, second.eventId);

    const res = await request(app).get('/api/registrations/mine').set(authHeader(participant.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].event).toMatchObject({ title: 'First event', registeredCount: 2 });
  });

  it('lets an admin see the participants of an event', async () => {
    const event = await createEvent(app, admin.token);
    await register(participant.token, event.eventId);
    const res = await request(app).get(`/api/events/${event.eventId}/participants`).set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user).toMatchObject({ name: participant.user.name, email: participant.email });
    expect(res.body[0].user).not.toHaveProperty('passwordHash');
  });

  it('forbids participants from the participant list (403)', async () => {
    const event = await createEvent(app, admin.token);
    const res = await request(app).get(`/api/events/${event.eventId}/participants`).set(authHeader(participant.token));
    expect(res.status).toBe(403);
  });

  it('forbids admins from "my registrations" (403)', async () => {
    const res = await request(app).get('/api/registrations/mine').set(authHeader(admin.token));
    expect(res.status).toBe(403);
  });
});
