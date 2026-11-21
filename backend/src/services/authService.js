'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getConfig } = require('../config/env');
const { presentUser } = require('../utils/presenters');

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so "unknown email" and "wrong password" take about the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

function signToken(user) {
  const { jwtSecret, jwtExpiresIn } = getConfig();
  return jwt.sign({ role: user.role }, jwtSecret, {
    subject: String(user._id),
    expiresIn: jwtExpiresIn,
    algorithm: 'HS256',
  });
}

/** @returns {{sub: string, role: string}} the verified token payload; throws if invalid/expired */
function verifyToken(token) {
  return jwt.verify(token, getConfig().jwtSecret, { algorithms: ['HS256'] });
}

function resolveRole(adminCode) {
  if (!adminCode) return 'participant';
  const { adminSignupCode } = getConfig();
  if (!adminSignupCode || adminCode !== adminSignupCode) {
    throw new AppError(403, 'Invalid admin signup code');
  }
  return 'admin';
}

async function register({ name, email, password, adminCode }) {
  const role = resolveRole(adminCode);
  if (await User.exists({ email })) {
    throw new AppError(409, 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user;
  try {
    user = await User.create({ name, email, passwordHash, role });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, 'An account with this email already exists');
    throw err;
  }
  return { token: signToken(user), user: presentUser(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !matches) {
    throw new AppError(401, 'Invalid email or password');
  }
  return { token: signToken(user), user: presentUser(user) };
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(401, 'Account no longer exists');
  return presentUser(user);
}

module.exports = { register, login, getProfile, signToken, verifyToken };
