'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
  feedback: { type: String, required: true },
  user: { type: Object }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
