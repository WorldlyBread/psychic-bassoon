'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimersSchema = new Schema({
  TWEET_EXTRACTION_FREQUENCY: { type: String, required: true, default: '*/30 * * * *' },
  DATA_ANALYSIS_FREQUENCY: { type: String, required: true, default: '1-59/30 * * * *' },
  CHECK_CONFIG_FREQUENCY: { type: String, required: true, default: '*/10 * * * *' },
  DATA_REVIEW_FREQUENCY: { type: String, required: true, default: '*/5 * * * *' },
  GET_STATS_FREQUENCY: { type: String, required: true, default: '*/3 * * * *' },
  GET_UNTRANSLATED_FREQUENCY: { type: String, required: true, default: '*/11 * * * *' },
  POPULATE_DB: { type: Boolean, required: true, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timers', TimersSchema);
