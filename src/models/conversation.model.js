'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OutputSchema = new Schema({
  _id: false,
  text: { type: Array },
  nodes_visited: { type: Array },
  log_messages: { type: Array }
});

const ContextSchema = new Schema(
  {
    alternate_intents: { type: Boolean },
    intents: { type: Array, required: true },
    entities: { type: Array, required: true },
    input: { type: Object, required: true },
    output: { type: OutputSchema, required: true },
    context: { type: Object },
    workspaceId: { type: String },
    configuracao: { type: String },
    origem: { type: String }
  },
  { timestamps: { createdAt: 'criadoEm' } }
);

module.exports = mongoose.model('Conversation', ContextSchema, 'Conversation');
