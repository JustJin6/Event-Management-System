'use strict';
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registrationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['registered', 'cancelled'], default: 'registered' },
});

// One row per (user, event): cancelling and re-registering re-uses the same row.
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
