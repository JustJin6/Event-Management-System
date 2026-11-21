'use strict';
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const { assertObjectId } = require('../utils/validators');
const { presentEvent, seatsOf } = require('../utils/presenters');

const ACTIVE = 'registered';

// Number of active registrations per event, as a Map(eventIdString -> count).
async function countsByEvent(eventIds) {
  const rows = await Registration.aggregate([
    { $match: { eventId: { $in: eventIds }, status: ACTIVE } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

const countRegistered = (eventId) => Registration.countDocuments({ eventId, status: ACTIVE });

async function findEventOrFail(eventId) {
  assertObjectId(eventId, 'event id');
  const event = await Event.findById(eventId);
  if (!event) throw new AppError(404, 'Event not found');
  return event;
}

async function listEvents() {
  const events = await Event.find().sort({ date: 1 }).lean();
  const counts = await countsByEvent(events.map((e) => e._id));
  return events.map((e) => presentEvent(e, counts.get(String(e._id)) || 0));
}

async function getEvent(eventId) {
  const event = await findEventOrFail(eventId);
  return presentEvent(event, await countRegistered(event._id));
}

async function createEvent(input) {
  const event = await Event.create(input);
  return presentEvent(event, 0);
}

async function updateEvent(eventId, input) {
  const event = await findEventOrFail(eventId);
  const registered = await countRegistered(event._id);
  if (input.capacity < registered) {
    throw new AppError(409, `Capacity cannot be lower than the ${registered} current registrations`);
  }
  event.set(input);
  await event.save();
  return presentEvent(event, registered);
}

async function updateCapacity(eventId, capacity) {
  const event = await findEventOrFail(eventId);
  const registered = await countRegistered(event._id);
  if (capacity < registered) {
    throw new AppError(409, `Capacity cannot be lower than the ${registered} current registrations`);
  }
  event.capacity = capacity;
  await event.save();
  return presentEvent(event, registered);
}

async function deleteEvent(eventId) {
  const event = await findEventOrFail(eventId);
  await Registration.deleteMany({ eventId: event._id });
  await event.deleteOne();
  return { eventId: String(event._id) };
}

// Seat figures for one event (used for real-time "seats changed" messages).
async function getSeats(eventId) {
  const event = await findEventOrFail(eventId);
  return seatsOf(event, await countRegistered(event._id));
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  updateCapacity,
  deleteEvent,
  getSeats,
  countsByEvent,
};
