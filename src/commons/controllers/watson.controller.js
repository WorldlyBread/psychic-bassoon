'use strict';

class WatsonController {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../logger/logger');
  }

  /** @description Sends message to Watson Assistant */
  async sendMessage(config, context, text, _id) {
    const {
      propriedades: { url, versao, senha }
    } = config;

    try {
      this.logger.info('Mensagem do usuário', { sender: context.sender, text });
      const res = await this.axios({
        method: 'post',
        headers: { 'content-type': 'application/json' },
        url: `${url}?version=${versao}`,
        auth: {
          username: 'apikey',
          password: senha
        },
        data: {
          input: {
            message_type: 'text',
            text: text,
            options: {
              alternate_intents: true,
              return_context: false
            }
          },
          context: context.context
        }
      });

      this.logger.info('Resposta do Watson', { sender: context.sender, text: res.data.output.text });

      const { data } = res;

      return data;
    } catch (err) {
      this.logger.error('[Error] [SendMessage]', err);
      return { entities: [], intents: [] };
    }
  }
}

module.exports = new WatsonController();
