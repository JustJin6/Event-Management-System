const request = require('supertest');
const db = require('../helpers/db');
const { createApp } = require('../../src/app');
const { createUser, authHeader } = require('../helpers/api');

const app = createApp();

beforeAll(db.connect);
beforeEach(db.clear);
afterAll(db.disconnect);

const validBody = { name: 'Jin Yang', email: 'jin@example.com', password: 'Password123!' };

describe('POST /api/auth/register', () => {
  it('creates a participant and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Jin Yang', email: 'jin@example.com', role: 'participant' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('creates an admin with the correct signup code', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validBody, adminCode: 'TEST-ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects a wrong signup code with 403', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validBody, adminCode: 'nope' });
    expect(res.status).toBe(403);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validBody);
    const res = await request(app).post('/api/auth/register').send(validBody);
    expect(res.status).toBe(409);
  });

  it('rejects invalid input with 400 and a list of errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { email, password } = await createUser(app);
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    const { email } = await createUser(app);
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Whatever123@' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token, user } = await createUser(app);
    const res = await request(app).get('/api/auth/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(user.userId);
  });

  it('returns 401 without a token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });
});

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route not found');
  });
});
