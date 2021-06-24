'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationMaxRetriesSchema = new Schema({
  _id: false,
  sales: { type: Number, default: 2 },
  fibra: { type: Number, default: 2 }
});

const ConversationLimit = new Schema({
  _id: false,
  maxConversations: { type: Number, default: 3 },
  period: { type: Number, default: 24 }
});

const ConfigurationSchema = new Schema({
  conversationLimit: {
    type: ConversationLimit,
    required: true,
    default: { maxConversations: 3, period: 24 }
  },
  conversationMaxRetries: {
    type: ConversationMaxRetriesSchema,
    default: { sales: 2, fibra: 2 }
  }
});

module.exports = mongoose.model('Configuration', ConfigurationSchema);
