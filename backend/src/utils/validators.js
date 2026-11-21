'use strict';
const AppError = require('./AppError');

const OBJECT_ID = /^[a-f\d]{24}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function throwIfAny(errors) {
  if (errors.length > 0) {
    throw new AppError(400, 'Validation failed', errors);
  }
}

const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

function isObjectId(value) {
  return typeof value === 'string' && OBJECT_ID.test(value);
}

function assertObjectId(value, label = 'id') {
  if (!isObjectId(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
}

function validateRegister(body = {}) {
  const errors = [];
  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 60) errors.push('Name must be 2-60 characters');
  if (!EMAIL.test(email)) errors.push('A valid email address is required');
  if (password.length < 8 || password.length > 72) errors.push('Password must be 8-72 characters');
  throwIfAny(errors);

  return { name, email, password, adminCode: asTrimmedString(body.adminCode) };
}

function validateLogin(body = {}) {
  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const errors = [];
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  throwIfAny(errors);
  return { email, password };
}

function parseCapacity(value, errors) {
  if (!Number.isInteger(value) || value < 1 || value > 100000) {
    errors.push('Capacity must be a whole number between 1 and 100000');
  }
  return value;
}

/**
 * Validates and cleans the editable fields of an event.
 * @param {object} body raw request body
 * @param {{requireFuture?: boolean}} options requireFuture rejects past dates (used on create)
 */
function validateEvent(body = {}, options = {}) {
  const errors = [];
  const title = asTrimmedString(body.title);
  const description = asTrimmedString(body.description);
  const venue = asTrimmedString(body.venue);
  const date = new Date(body.date);

  if (title.length < 3 || title.length > 100) errors.push('Title must be 3-100 characters');
  if (description.length < 1 || description.length > 2000) errors.push('Description must be 1-2000 characters');
  if (venue.length < 2 || venue.length > 100) errors.push('Venue must be 2-100 characters');
  if (typeof body.date !== 'string' || Number.isNaN(date.getTime())) {
    errors.push('A valid date is required');
  } else if (options.requireFuture && date.getTime() <= Date.now()) {
    errors.push('Date must be in the future');
  }
  const capacity = parseCapacity(body.capacity, errors);
  throwIfAny(errors);

  return { title, description, venue, date, capacity };
}

function validateCapacity(body = {}) {
  const errors = [];
  const capacity = parseCapacity(body.capacity, errors);
  throwIfAny(errors);
  return capacity;
}

module.exports = {
  isObjectId,
  assertObjectId,
  validateRegister,
  validateLogin,
  validateEvent,
  validateCapacity,
};
