const {
  validateRegister,
  validateLogin,
  validateEvent,
  validateCapacity,
  isObjectId,
  assertObjectId,
} = require('../../src/utils/validators');

const tomorrow = () => new Date(Date.now() + 86400000).toISOString();
const validEvent = () => ({
  title: 'Career Fair',
  description: 'Meet employers',
  venue: 'Hall A',
  date: tomorrow(),
  capacity: 50,
});

describe('validateRegister', () => {
  it('returns cleaned values for valid input', () => {
    const result = validateRegister({ name: '  Ann Hsu ', email: ' ANN@Example.com ', password: 'secret123' });
    expect(result).toEqual({ name: 'Ann Hsu', email: 'ann@example.com', password: 'secret123', adminCode: '' });
  });

  it('collects every problem in one error', () => {
    expect.assertions(3);
    try {
      validateRegister({ name: 'A', email: 'nope', password: 'short' });
    } catch (err) {
      expect(err.status).toBe(400);
      expect(err.details).toHaveLength(3);
      expect(err.message).toBe('Validation failed');
    }
  });

  it('rejects a missing body', () => {
    expect(() => validateRegister(undefined)).toThrow('Validation failed');
  });
});

describe('validateLogin', () => {
  it('requires email and password', () => {
    expect(() => validateLogin({})).toThrow('Validation failed');
    expect(validateLogin({ email: 'A@B.com', password: 'x' })).toEqual({ email: 'a@b.com', password: 'x' });
  });
});

describe('validateEvent', () => {
  it('accepts a valid event and converts the date', () => {
    const result = validateEvent(validEvent(), { requireFuture: true });
    expect(result.date).toBeInstanceOf(Date);
    expect(result.capacity).toBe(50);
  });

  it('rejects a past date only when requireFuture is set', () => {
    const past = { ...validEvent(), date: '2000-01-01T10:00:00.000Z' };
    expect(() => validateEvent(past, { requireFuture: true })).toThrow('Validation failed');
    expect(() => validateEvent(past)).not.toThrow();
  });

  it.each([0, -5, 2.5, '10', null])('rejects capacity %p', (capacity) => {
    expect(() => validateEvent({ ...validEvent(), capacity })).toThrow('Validation failed');
  });

  it('rejects an invalid date string', () => {
    expect(() => validateEvent({ ...validEvent(), date: 'not-a-date' })).toThrow('Validation failed');
  });
});

describe('validateCapacity', () => {
  it('returns the number or throws', () => {
    expect(validateCapacity({ capacity: 25 })).toBe(25);
    expect(() => validateCapacity({ capacity: 0 })).toThrow();
  });
});

describe('ObjectId helpers', () => {
  it('recognises 24-character hex ids only', () => {
    expect(isObjectId('a'.repeat(24))).toBe(true);
    expect(isObjectId('xyz')).toBe(false);
    expect(isObjectId(123)).toBe(false);
  });

  it('assertObjectId throws a 400', () => {
    expect.assertions(1);
    try {
      assertObjectId('bad', 'event id');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});
