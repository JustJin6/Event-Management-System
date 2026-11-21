// System test: the whole back end running for real (HTTP server + Socket.IO + MongoDB), exercised the way the Angular client uses it - over HTTP and two live WebSocket clients.
const { io: connectSocket } = require('socket.io-client');
const db = require('../helpers/db');
const realtime = require('../../src/sockets/realtime');
const { createHttpServer } = require('../../src/createServer');
const { futureDate } = require('../helpers/api');

let server;
let baseUrl;
const sockets = [];

async function api(method, path, { token, body } = {}) {
  const res = await globalThis.fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

async function signUp(name, email, adminCode) {
  const { body } = await api('POST', '/auth/register', {
    body: { name, email, password: 'Password123!', ...(adminCode ? { adminCode } : {}) },
  });
  return body;
}

function connect(token) {
  const socket = connectSocket(baseUrl, { auth: { token }, transports: ['websocket'], reconnection: false });
  sockets.push(socket);
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

// Resolves with the payload of the next `eventName` message. Call BEFORE triggering the action.
function nextMessage(socket, eventName, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), timeoutMs);
    socket.once(eventName, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

beforeAll(async () => {
  await db.connect();
  await db.clear();
  server = createHttpServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  sockets.forEach((s) => s.close());
  await realtime.close();
  await db.disconnect();
});

describe('real-time event management', () => {
  it('rejects a WebSocket connection without a valid token', async () => {
    const socket = connectSocket(baseUrl, { auth: { token: 'bad' }, transports: ['websocket'], reconnection: false });
    sockets.push(socket);
    const error = await new Promise((resolve) => socket.on('connect_error', resolve));
    expect(error.message).toBe('Authentication required');
  });

  it('keeps every connected client in sync from creation to deletion', async () => {
    const admin = await signUp('Admin', 'admin@system.test', 'TEST-ADMIN');
    const terence = await signUp('Terence', 'terence@system.test');
    const nafisah = await signUp('Nafisah', 'nafisah@system.test');

    const adminSocket = await connect(admin.token);
    const terenceSocket = await connect(terence.token);
    const nafisahSocket = await connect(nafisah.token);

    // 1. Admin creates an event -> both participants see it without asking.
    let terenceSees = nextMessage(terenceSocket, 'event:created');
    let nafisahSees = nextMessage(nafisahSocket, 'event:created');
    const created = await api('POST', '/events', {
      token: admin.token,
      body: { title: 'Live Demo Event', description: 'System test', date: futureDate(5), venue: 'Hall 1', capacity: 2 },
    });
    expect(created.status).toBe(201);
    const eventId = created.body.eventId;
    expect((await terenceSees).eventId).toBe(eventId);
    expect((await nafisahSees).title).toBe('Live Demo Event');

    // 2. Terence registers -> Admin and Nafisah see the seat count drop.
    let adminSeats = nextMessage(adminSocket, 'event:seats');
    let nafisahSeats = nextMessage(nafisahSocket, 'event:seats');
    expect((await api('POST', `/events/${eventId}/register`, { token: terence.token })).status).toBe(201);
    expect(await adminSeats).toMatchObject({ eventId, registeredCount: 1, seatsAvailable: 1 });
    expect((await nafisahSeats).seatsAvailable).toBe(1);

    // 3. Nafisah takes the last seat; a further registration is refused.
    adminSeats = nextMessage(adminSocket, 'event:seats');
    expect((await api('POST', `/events/${eventId}/register`, { token: nafisah.token })).status).toBe(201);
    expect(await adminSeats).toMatchObject({ registeredCount: 2, seatsAvailable: 0 });
    const carol = await signUp('Carol', 'carol@system.test');
    expect((await api('POST', `/events/${eventId}/register`, { token: carol.token })).status).toBe(409);

    // 4. Terence cancels -> seat is freed and everyone is told.
    adminSeats = nextMessage(adminSocket, 'event:seats');
    await api('DELETE', `/events/${eventId}/register`, { token: terence.token });
    expect(await adminSeats).toMatchObject({ registeredCount: 1, seatsAvailable: 1 });

    // 5. Admin updates the event -> participants get the new details.
    terenceSees = nextMessage(terenceSocket, 'event:updated');
    await api('PUT', `/events/${eventId}`, {
      token: admin.token,
      body: { title: 'Renamed Live Event', description: 'System test', date: futureDate(6), venue: 'Hall 2', capacity: 5 },
    });
    expect(await terenceSees).toMatchObject({ title: 'Renamed Live Event', venue: 'Hall 2', seatsAvailable: 4 });

    // 6. Admin deletes the event -> participants are told to remove it.
    nafisahSees = nextMessage(nafisahSocket, 'event:deleted');
    await api('DELETE', `/events/${eventId}`, { token: admin.token });
    expect(await nafisahSees).toEqual({ eventId });
  });

  it('broadcasts how many users are online', async () => {
    const khairi = await signUp('Khairi', 'khairi@system.test');
    const watcher = await connect(khairi.token);
    const update = nextMessage(watcher, 'presence');
    const eric = await signUp('Eric', 'eric@system.test');
    await connect(eric.token);
    expect((await update).online).toBeGreaterThanOrEqual(2);
  });
});
