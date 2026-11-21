const { presentUser, presentEvent, seatsOf } = require('../../src/utils/presenters');

describe('presenters', () => {
  it('never exposes the password hash', () => {
    const json = presentUser({ _id: 'u1', name: 'Jin', email: 'a@b.com', role: 'admin', passwordHash: 'secret' });
    expect(json).toEqual({ userId: 'u1', name: 'Jin', email: 'a@b.com', role: 'admin' });
    expect(JSON.stringify(json)).not.toContain('secret');
  });

  it('calculates seats available', () => {
    const event = { _id: 'e1', title: 'T', description: 'D', date: new Date(), venue: 'V', capacity: 10 };
    expect(presentEvent(event, 4)).toMatchObject({ eventId: 'e1', registeredCount: 4, seatsAvailable: 6 });
  });

  it('never reports negative seats', () => {
    expect(seatsOf({ _id: 'e1', capacity: 2 }, 5).seatsAvailable).toBe(0);
  });
});
