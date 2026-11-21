'use strict';
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { getConfig } = require('../config/env');

const router = Router();

// Slows down password guessing: max N register/login calls per IP per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => getConfig().authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
