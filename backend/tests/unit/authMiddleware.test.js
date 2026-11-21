const { authenticate, requireRole } = require('../../src/middleware/auth');
const { signToken } = require('../../src/services/authService');

function run(middleware, req) {
  const next = jest.fn();
  middleware(req, {}, next);
  return next;
}

describe('authenticate', () => {
  it('accepts a valid bearer token and sets req.user', () => {
    const token = signToken({ _id: 'user-1', role: 'participant' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = run(authenticate, req);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'user-1', role: 'participant' });
  });

  it.each([
    ['no header', {}],
    ['wrong scheme', { authorization: 'Basic abc' }],
    ['garbage token', { authorization: 'Bearer not.a.jwt' }],
  ])('rejects %s with 401', (_label, headers) => {
    const next = run(authenticate, { headers });
    expect(next.mock.calls[0][0].status).toBe(401);
  });
});

describe('requireRole', () => {
  it('lets the right role through and blocks others with 403', () => {
    const adminOnly = requireRole('admin');
    expect(run(adminOnly, { user: { role: 'admin' } })).toHaveBeenCalledWith();
    expect(run(adminOnly, { user: { role: 'participant' } }).mock.calls[0][0].status).toBe(403);
    expect(run(adminOnly, {}).mock.calls[0][0].status).toBe(403);
  });
});
