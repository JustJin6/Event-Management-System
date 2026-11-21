'use strict';
const eventService = require('../services/eventService');
const realtime = require('../sockets/realtime');
const { validateEvent, validateCapacity } = require('../utils/validators');

async function list(_req, res) {
  res.json(await eventService.listEvents());
}

async function get(req, res) {
  res.json(await eventService.getEvent(req.params.eventId));
}

async function create(req, res) {
  const event = await eventService.createEvent(validateEvent(req.body, { requireFuture: true }));
  realtime.emit('event:created', event);
  res.status(201).json(event);
}

async function update(req, res) {
  const event = await eventService.updateEvent(req.params.eventId, validateEvent(req.body));
  realtime.emit('event:updated', event);
  res.json(event);
}

async function updateCapacity(req, res) {
  const event = await eventService.updateCapacity(req.params.eventId, validateCapacity(req.body));
  realtime.emit('event:updated', event);
  res.json(event);
}

async function remove(req, res) {
  const result = await eventService.deleteEvent(req.params.eventId);
  realtime.emit('event:deleted', result);
  res.json(result);
}

module.exports = { list, get, create, update, updateCapacity, remove };
