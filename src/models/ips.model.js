'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IpsSchema = new Schema({
  IP: { type: String, index: true, unique: true },
  Access: { type: Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ips', IpsSchema);
