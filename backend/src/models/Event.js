'use strict';
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    date: { type: Date, required: true, index: true },
    venue: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Event', eventSchema);
