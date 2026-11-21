'use strict';
const authService = require('../services/authService');
const { validateRegister, validateLogin } = require('../utils/validators');

async function register(req, res) {
  const result = await authService.register(validateRegister(req.body));
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.login(validateLogin(req.body));
  res.json(result);
}

async function me(req, res) {
  res.json(await authService.getProfile(req.user.id));
}

module.exports = { register, login, me };
