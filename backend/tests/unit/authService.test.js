jest.mock('../../src/models/User', () => ({
  exists: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const authService = require('../../src/services/authService');

const input = { name: 'Jin', email: 'jin@example.com', password: 'secret123', adminCode: '' };

beforeEach(() => jest.resetAllMocks());

describe('authService.register', () => {
  it('creates a participant by default and stores a bcrypt hash, not the password', async () => {
    User.exists.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => ({ _id: 'u1', ...data }));

    const result = await authService.register(input);

    const saved = User.create.mock.calls[0][0];
    expect(saved.role).toBe('participant');
    expect(saved.passwordHash).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', saved.passwordHash)).toBe(true);
    expect(result.token).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('creates an admin when the signup code is correct', async () => {
    User.exists.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => ({ _id: 'u2', ...data }));
    const result = await authService.register({ ...input, adminCode: 'TEST-ADMIN' });
    expect(result.user.role).toBe('admin');
  });

  it('rejects a wrong admin code with 403 before touching the database', async () => {
    await expect(authService.register({ ...input, adminCode: 'WRONG' })).rejects.toMatchObject({ status: 403 });
    expect(User.exists).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email with 409', async () => {
    User.exists.mockResolvedValue({ _id: 'existing' });
    await expect(authService.register(input)).rejects.toMatchObject({ status: 409 });
  });
});

describe('authService.login', () => {
  it('returns a verifiable token for the right password', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    User.findOne.mockResolvedValue({ _id: 'u1', name: 'Jin', email: input.email, role: 'participant', passwordHash });
    const { token } = await authService.login({ email: input.email, password: 'secret123' });
    expect(authService.verifyToken(token)).toMatchObject({ sub: 'u1', role: 'participant' });
  });

  it('gives the same 401 for an unknown email and a wrong password', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: 'u1', role: 'participant', passwordHash });
    const unknown = await authService.login({ email: 'x@y.com', password: 'whatever1' }).catch((e) => e);
    const wrong = await authService.login({ email: input.email, password: 'wrong-password' }).catch((e) => e);
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.message).toBe(wrong.message);
  });
});
