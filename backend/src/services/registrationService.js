'use strict';
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const { assertObjectId } = require('../utils/validators');
const {
  presentEvent,
  presentRegistration,
  presentParticipant,
  seatsOf,
} = require('../utils/presenters');
const { countsByEvent } = require('./eventService');

const ACTIVE = 'registered';
const countRegistered = (eventId) => Registration.countDocuments({ eventId, status: ACTIVE });

async function findEventOrFail(eventId) {
  assertObjectId(eventId, 'event id');
  const event = await Event.findById(eventId).lean();
  if (!event) throw new AppError(404, 'Event not found');
  return event;
}

// Re-activates a cancelled registration or creates a new one.
async function saveActiveRegistration(userId, eventId, existing) {
  if (existing) {
    existing.status = ACTIVE;
    existing.registrationDate = new Date();
    return existing.save();
  }
  try {
    return await Registration.create({ userId, eventId });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, 'You are already registered for this event');
    throw err;
  }
}

async function undoRegistration(registration, wasCancelled) {
  if (wasCancelled) {
    registration.status = 'cancelled';
    await registration.save();
  } else {
    await Registration.deleteOne({ _id: registration._id });
  }
}

async function register(userId, eventId) {
  const event = await findEventOrFail(eventId);
  const existing = await Registration.findOne({ userId, eventId: event._id });
  if (existing && existing.status === ACTIVE) {
    throw new AppError(409, 'You are already registered for this event');
  }
  if ((await countRegistered(event._id)) >= event.capacity) {
    throw new AppError(409, 'This event is full');
  }

  const registration = await saveActiveRegistration(userId, event._id, existing);

  // Two people may take the last seat at the same moment. Re-count after saving, whoever pushed the total over capacity is rolled back.
  const registeredCount = await countRegistered(event._id);
  if (registeredCount > event.capacity) {
    await undoRegistration(registration, Boolean(existing));
    throw new AppError(409, 'This event is full');
  }
  return {
    registration: presentRegistration(registration),
    seats: seatsOf(event, registeredCount),
  };
}

async function cancel(userId, eventId) {
  const event = await findEventOrFail(eventId);
  const registration = await Registration.findOne({ userId, eventId: event._id, status: ACTIVE });
  if (!registration) throw new AppError(404, 'You are not registered for this event');
  registration.status = 'cancelled';
  await registration.save();
  return {
    registration: presentRegistration(registration),
    seats: seatsOf(event, await countRegistered(event._id)),
  };
}

// The logged-in participant's active registrations, each with its event.
async function listMine(userId) {
  const registrations = await Registration.find({ userId, status: ACTIVE })
    .sort({ registrationDate: -1 })
    .lean();
  const eventIds = registrations.map((r) => r.eventId);
  const events = await Event.find({ _id: { $in: eventIds } }).lean();
  const counts = await countsByEvent(eventIds);
  const eventsById = new Map(events.map((e) => [String(e._id), e]));

  return registrations
    .filter((r) => eventsById.has(String(r.eventId)))
    .map((r) => ({
      ...presentRegistration(r),
      event: presentEvent(eventsById.get(String(r.eventId)), counts.get(String(r.eventId)) || 0),
    }));
}

// Admin view: who is registered for an event.
async function listParticipants(eventId) {
  const event = await findEventOrFail(eventId);
  const registrations = await Registration.find({ eventId: event._id, status: ACTIVE })
    .populate('userId', 'name email')
    .sort({ registrationDate: 1 })
    .lean();
  return registrations.filter((r) => r.userId).map(presentParticipant);
}

module.exports = { register, cancel, listMine, listParticipants };
