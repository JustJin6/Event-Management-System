'use strict';
const { Router } = require('express');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', require('./authRoutes'));
router.use('/events', require('./eventRoutes'));
router.use('/registrations', require('./registrationRoutes'));

module.exports = router;
