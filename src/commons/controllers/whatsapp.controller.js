'use strict';
const https = require('https');

class WhatsappController {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.agent = new https.Agent({
      // Ignore ssl certificate errors
      rejectUnauthorized: false
    });
  }

  // Adicionar lógica de salvar no banco e verificar se está expirado
  async getToken() {
    const res = await this.axios({
      method: 'post',
      url: `${process.env.WHATSAPP_URL}/v1/users/login`,
      headers: { Authorization: `Basic ${process.env.WHATSAPP_AUTH}` },
      httpsAgent: this.agent
    });

    console.log(res.data.users[0].token);
    return res.data.users[0].token;
  }

  async send(data) {
    const token = await this.getToken();
    const res = await this.axios({
      method: 'post',
      url: `${process.env.WHATSAPP_URL}/v1/messages`,
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      httpsAgent: this.agent,
      data
    });

    console.log(res.data);
  }
}

module.exports = new WhatsappController();
