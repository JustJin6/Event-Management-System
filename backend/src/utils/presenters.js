'use strict';

// Presenters turn database documents into the JSON the API returns.
// Keeping this in one place means no controller can accidentally leak a password hash, and every response uses the same field names.

function presentUser(user) {
  return {
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function seatsOf(event, registeredCount) {
  return {
    eventId: String(event._id),
    capacity: event.capacity,
    registeredCount,
    seatsAvailable: Math.max(event.capacity - registeredCount, 0),
  };
}

function presentEvent(event, registeredCount = 0) {
  return {
    eventId: String(event._id),
    title: event.title,
    description: event.description,
    date: event.date,
    venue: event.venue,
    capacity: event.capacity,
    registeredCount,
    seatsAvailable: Math.max(event.capacity - registeredCount, 0),
  };
}

function presentRegistration(registration) {
  return {
    registrationId: String(registration._id),
    userId: String(registration.userId),
    eventId: String(registration.eventId),
    registrationDate: registration.registrationDate,
    status: registration.status,
  };
}

// A registration whose userId was populated with { name, email }.
function presentParticipant(registration) {
  const user = registration.userId;
  return {
    registrationId: String(registration._id),
    registrationDate: registration.registrationDate,
    status: registration.status,
    user: { userId: String(user._id), name: user.name, email: user.email },
  };
}

module.exports = { presentUser, presentEvent, presentRegistration, presentParticipant, seatsOf };
