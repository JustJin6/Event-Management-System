const request = require('supertest');
const db = require('../helpers/db');
const { createApp } = require('../../src/app');
const { createUser, authHeader, createEvent, eventBody, futureDate } = require('../helpers/api');

const app = createApp();
let admin;
let participant;

beforeAll(db.connect);
beforeEach(async () => {
  await db.clear();
  admin = await createUser(app, { admin: true });
  participant = await createUser(app);
});
afterAll(db.disconnect);

describe('creating events', () => {
  it('lets an admin create an event', async () => {
    const res = await request(app).post('/api/events').set(authHeader(admin.token)).send(eventBody());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Test Workshop', capacity: 10, registeredCount: 0, seatsAvailable: 10 });
    expect(res.body.eventId).toEqual(expect.any(String));
  });

  it('forbids participants (403)', async () => {
    const res = await request(app).post('/api/events').set(authHeader(participant.token)).send(eventBody());
    expect(res.status).toBe(403);
  });

  it('requires login (401)', async () => {
    expect((await request(app).post('/api/events').send(eventBody())).status).toBe(401);
  });

  it('rejects a past date and a zero capacity (400)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set(authHeader(admin.token))
      .send(eventBody({ date: '2001-01-01T10:00:00.000Z', capacity: 0 }));
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveLength(2);
  });
});

describe('reading events', () => {
  it('lists events soonest first, for any logged-in user', async () => {
    await createEvent(app, admin.token, { title: 'Later event', date: futureDate(20) });
    await createEvent(app, admin.token, { title: 'Sooner event', date: futureDate(2) });
    const res = await request(app).get('/api/events').set(authHeader(participant.token));
    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.title)).toEqual(['Sooner event', 'Later event']);
  });

  it('gets one event by id', async () => {
    const created = await createEvent(app, admin.token);
    const res = await request(app).get(`/api/events/${created.eventId}`).set(authHeader(participant.token));
    expect(res.status).toBe(200);
    expect(res.body.eventId).toBe(created.eventId);
  });

  it('returns 400 for a malformed id and 404 for an unknown id', async () => {
    const bad = await request(app).get('/api/events/not-an-id').set(authHeader(admin.token));
    const missing = await request(app).get(`/api/events/${'f'.repeat(24)}`).set(authHeader(admin.token));
    expect(bad.status).toBe(400);
    expect(missing.status).toBe(404);
  });
});

describe('updating events', () => {
  it('lets an admin update an event', async () => {
    const created = await createEvent(app, admin.token);
    const res = await request(app)
      .put(`/api/events/${created.eventId}`)
      .set(authHeader(admin.token))
      .send(eventBody({ title: 'Renamed Workshop', venue: 'Room 202' }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Renamed Workshop', venue: 'Room 202' });
  });

  it('lets an admin change capacity', async () => {
    const created = await createEvent(app, admin.token);
    const res = await request(app)
      .patch(`/api/events/${created.eventId}/capacity`)
      .set(authHeader(admin.token))
      .send({ capacity: 25 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ capacity: 25, seatsAvailable: 25 });
  });

  it('refuses a capacity below the current registrations (409)', async () => {
    const created = await createEvent(app, admin.token, { capacity: 5 });
    const other = await createUser(app);
    await request(app).post(`/api/events/${created.eventId}/register`).set(authHeader(participant.token));
    await request(app).post(`/api/events/${created.eventId}/register`).set(authHeader(other.token));

    const res = await request(app)
      .patch(`/api/events/${created.eventId}/capacity`)
      .set(authHeader(admin.token))
      .send({ capacity: 1 });
    expect(res.status).toBe(409);
  });

  it('forbids participants from updating (403)', async () => {
    const created = await createEvent(app, admin.token);
    const res = await request(app)
      .put(`/api/events/${created.eventId}`)
      .set(authHeader(participant.token))
      .send(eventBody());
    expect(res.status).toBe(403);
  });
});

describe('deleting events', () => {
  it('deletes the event and its registrations', async () => {
    const created = await createEvent(app, admin.token);
    await request(app).post(`/api/events/${created.eventId}/register`).set(authHeader(participant.token));

    const res = await request(app).delete(`/api/events/${created.eventId}`).set(authHeader(admin.token));
    expect(res.status).toBe(200);

    expect((await request(app).get(`/api/events/${created.eventId}`).set(authHeader(admin.token))).status).toBe(404);
    const mine = await request(app).get('/api/registrations/mine').set(authHeader(participant.token));
    expect(mine.body).toEqual([]);
  });

  it('forbids participants (403)', async () => {
    const created = await createEvent(app, admin.token);
    const res = await request(app).delete(`/api/events/${created.eventId}`).set(authHeader(participant.token));
    expect(res.status).toBe(403);
  });
});
