'use strict';
const registrationService = require('../services/registrationService');
const realtime = require('../sockets/realtime');

async function register(req, res) {
  const { registration, seats } = await registrationService.register(req.user.id, req.params.eventId);
  realtime.emit('event:seats', seats);
  res.status(201).json({ registration, seats });
}

async function cancel(req, res) {
  const { registration, seats } = await registrationService.cancel(req.user.id, req.params.eventId);
  realtime.emit('event:seats', seats);
  res.json({ registration, seats });
}

async function mine(req, res) {
  res.json(await registrationService.listMine(req.user.id));
}

async function participants(req, res) {
  res.json(await registrationService.listParticipants(req.params.eventId));
}

module.exports = { register, cancel, mine, participants };
