jest.mock('../../src/models/Event', () => ({ findById: jest.fn() }));
jest.mock('../../src/models/Registration', () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn(),
}));

const Event = require('../../src/models/Event');
const Registration = require('../../src/models/Registration');
const registrationService = require('../../src/services/registrationService');

const EVENT_ID = 'a'.repeat(24);
const USER_ID = 'b'.repeat(24);
const event = (capacity) => ({ _id: EVENT_ID, capacity });
const newRegistration = () => ({
  _id: 'r1', userId: USER_ID, eventId: EVENT_ID, registrationDate: new Date(), status: 'registered',
});

beforeEach(() => {
  jest.resetAllMocks();
  Registration.findOne.mockResolvedValue(null);
});

const eventExists = (capacity) =>
  Event.findById.mockReturnValue({ lean: () => Promise.resolve(event(capacity)) });

describe('registrationService.register', () => {
  it('registers and reports the remaining seats', async () => {
    eventExists(2);
    Registration.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    Registration.create.mockResolvedValue(newRegistration());

    const { registration, seats } = await registrationService.register(USER_ID, EVENT_ID);

    expect(registration.status).toBe('registered');
    expect(seats).toMatchObject({ capacity: 2, registeredCount: 1, seatsAvailable: 1 });
  });

  it('returns 404 for an unknown event', async () => {
    Event.findById.mockReturnValue({ lean: () => Promise.resolve(null) });
    await expect(registrationService.register(USER_ID, EVENT_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('returns 409 if the user is already registered', async () => {
    eventExists(5);
    Registration.findOne.mockResolvedValue({ status: 'registered' });
    await expect(registrationService.register(USER_ID, EVENT_ID)).rejects.toMatchObject({ status: 409 });
    expect(Registration.create).not.toHaveBeenCalled();
  });

  it('returns 409 when the event is already full', async () => {
    eventExists(2);
    Registration.countDocuments.mockResolvedValue(2);
    await expect(registrationService.register(USER_ID, EVENT_ID)).rejects.toMatchObject({ status: 409 });
    expect(Registration.create).not.toHaveBeenCalled();
  });

  it('rolls back when someone else took the last seat at the same moment', async () => {
    eventExists(2);
    Registration.countDocuments.mockResolvedValueOnce(1).mockResolvedValueOnce(3);
    Registration.create.mockResolvedValue(newRegistration());
    Registration.deleteOne.mockResolvedValue({});

    await expect(registrationService.register(USER_ID, EVENT_ID)).rejects.toMatchObject({ status: 409 });
    expect(Registration.deleteOne).toHaveBeenCalledWith({ _id: 'r1' });
  });

  it('re-activates a cancelled registration instead of creating a new one', async () => {
    eventExists(5);
    const cancelled = { ...newRegistration(), status: 'cancelled', save() { return Promise.resolve(this); } };
    Registration.findOne.mockResolvedValue(cancelled);
    Registration.countDocuments.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    const { registration } = await registrationService.register(USER_ID, EVENT_ID);

    expect(registration.status).toBe('registered');
    expect(Registration.create).not.toHaveBeenCalled();
  });
});

describe('registrationService.cancel', () => {
  it('cancels an active registration', async () => {
    eventExists(5);
    const active = { ...newRegistration(), save() { return Promise.resolve(this); } };
    Registration.findOne.mockResolvedValue(active);
    Registration.countDocuments.mockResolvedValue(0);

    const { registration, seats } = await registrationService.cancel(USER_ID, EVENT_ID);

    expect(registration.status).toBe('cancelled');
    expect(seats.seatsAvailable).toBe(5);
  });

  it('returns 404 when there is nothing to cancel', async () => {
    eventExists(5);
    await expect(registrationService.cancel(USER_ID, EVENT_ID)).rejects.toMatchObject({ status: 404 });
  });
});
