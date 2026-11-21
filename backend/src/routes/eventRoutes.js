'use strict';
const { Router } = require('express');
const events = require('../controllers/eventController');
const registrations = require('../controllers/registrationController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();
const adminOnly = requireRole('admin');
const participantOnly = requireRole('participant');

router.use(authenticate);

// Any logged-in user
router.get('/', events.list);
router.get('/:eventId', events.get);

// Admin: manage events and see who registered
router.post('/', adminOnly, events.create);
router.put('/:eventId', adminOnly, events.update);
router.patch('/:eventId/capacity', adminOnly, events.updateCapacity);
router.delete('/:eventId', adminOnly, events.remove);
router.get('/:eventId/participants', adminOnly, registrations.participants);

// Participant: register for / cancel an event
router.post('/:eventId/register', participantOnly, registrations.register);
router.delete('/:eventId/register', participantOnly, registrations.cancel);

module.exports = router;
