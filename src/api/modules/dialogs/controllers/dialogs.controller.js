'use strict';
const { last } = require('lodash');
const HttpController = require('../../../../commons/controllers/http.controller');

class DialogsController extends HttpController {
  constructor() {
    super();
    this.Context = require('../../../../models/context.model');
    this.FlowController = require('../../../../commons/controllers/flow.controller');
    this.sendMessage = this.sendMessage.bind(this);
  }

  async sendMessage(req, res, next) {
    const payload = req.body;

    // Validando conteúdo do request
    if (!payload.messages) {
      this.logger.info('Invalid payload', payload);
      throw new this.HttpError('Invalid payload', 400);
    }

    const item = payload.messages[0];

    if (
      item.type !== 'text' || // Imagens e documentos
      (item.text && !item.text.body) || // Possui texto do usuário
      !item.text
    ) {
      this.logger.info('Invalid message type', payload);
      throw new this.HttpError('Invalid message type', 400);
    }

    if (!item.from) {
      this.logger.info('Invalid sender', payload);
      throw new this.HttpError('Invalid sender', 400);
    }

    // Request com o formato esperado
    const lastContext = await this.Context.findOne({
      'context.sender': item.from,
      criadoEm: { $gt: this.moment().subtract(1, 'day') }
    }).lean();

    if (lastContext) {
      // Continuação de uma conversa
      this.FlowController.processMessage(item, lastContext);
    } else {
      // Conversa nova
    }
  }
}

module.exports = new DialogsController();
