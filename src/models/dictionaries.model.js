'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DictSchema = new Schema({
  word: { type: String, required: true },
  replacement: { type: String },
  type: { type: String, required: true },
  ignore: { type: Boolean, default: false },
  reason: { type: String },
  kibana: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dictionaries', DictSchema);
