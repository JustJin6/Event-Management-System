'use strict';
const { Router } = require('express');
const controller = require('../controllers/registrationController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/mine', authenticate, requireRole('participant'), controller.mine);

module.exports = router;
