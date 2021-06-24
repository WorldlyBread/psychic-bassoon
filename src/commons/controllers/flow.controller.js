'use strict';

class FlowController {
  constructor() {
    this.moment = require('moment');
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.Offer = require('../../models/offer.model');
    this.Context = require('../../models/context.model');
    this.Configurations = require('../../models/configuration.model');
    this.Conversation = require('../../models/conversation.model');
    this.Configuracao = require('../../models/configuracao.model');
    this.WatsonController = require('./watson.controller');
    this.WhatsappController = require('./whatsapp.controller');
  }

  getDates(amount, shift, removeSunday = true) {
    let i = 1;
    let day = this.moment().add(shift, 'days');
    let list = [];

    while (i <= amount) {
      if (day.isoWeekday() !== 7 || !removeSunday) {
        list.push({
          text: `*${list.length + 1}* - ${day.format('DD/MM/YY')}`,
          value: day.format('DD/MM/YYYY'),
          watson: day.format('YYYY-MM-DD')
        });
      }
      day = this.moment().add(shift + i, 'days');
      i++;
    }
  }

  async processMessage(message, document) {
    const { context, _id } = document;
    this.logger.info('Adding mandatory variables', document._id);

    // Adicionar campos ao contexto (pode ficar em uma utils)
    if (message.origin === 'lead-handler') {
      this.logger.info('Adding bot-recuperacao context');
      context.dd = { ...context.dd, ...message.context };
      context.target = 'sales';
    }

    if (!context.maxRetries) {
      try {
        let { conversationMaxRetries } = await this.Configuration.findOne({});
        context.maxRetries = conversationMaxRetries;
      } catch (err) {
        this.logger.error('whatsapp-wrapper :: insertContext :: error obtaining maxRetries', err);
        context.maxRetries = { sales: 2, fibra: 2 };
      }
    }

    if (!context.dd) {
      context.dd = {};
    }

    if (!context.dd.offers || context.dd.offers.length < 1) {
      try {
        this.logger.info('Adding offers to context', {
          sender: context.sender
        });

        let offers = await this.Offer.find({ isActive: true }).lean();
        offers.sort((a, b) => {
          return a.rank >= b.rank ? 1 : -1;
        });

        context.dd.offers = offers;
      } catch (err) {
        this.logger.error('Error obtaining offers', err);
        context.dd.offers = [];
      }
    }

    this.Context.findByIdAndUpdate(_id, { $set: context });

    // Validações pré-envio Watson (tbm pode ser utils)
    if (context.solicitarDatas) {
      context.datasParaAgendamento = this.getDates(10, 2, true);
      delete context.solicitarDatas;
    }

    context.passo = context.passo + 1 || 0;

    const conversation = document;
    delete conversation._id;

    const doc = await this.Conversation.create(conversation);
    console.log(`${doc._id} criado`, doc);

    if (context && context.target) {
      // Verificar se o target é um dos dois possíveis; criar targets como constant, target default para casos de exceção...
      const WatsonConfigs = await this.Configuracao.findOne({
        nomeServico: context.target
      }).lean();

      if (WatsonConfigs) {
        // Preparação para envio watson -- entender necessidade
        if (context.conversation_id_lista === undefined) {
          context['conversation_id_lista'] = { [context.target]: null };
        }

        if (context.conversation_id_lista[context.target] != null) {
          context.conversation_id = context.conversation_id_lista[context.target];
        }

        if (!context.system_list) {
          context['system_list'] = {};
        }

        if (context.system_list[context.target] != null) {
          context.system = context.system_list[context.target];
        }

        // Rever
        const response = await this.WatsonController.sendMessage(WatsonConfigs, context, document.input.text, _id);

        // // Verificar necessidade
        // context.workspaceId = WatsonConfigs.propriedades.workspaceId;
        // context.configuracao = context.target;
        // context.context = response.context;
        // context.context.conversation_id_lista[context.target] = context.context.conversation_id;
        // context.context.system_list[context.target] = context.context.system;

        const responseDoc = await this.Conversation.create(response);
        console.log(`${responseDoc._id} criado`, doc);

        // Adicionar regras pós watson salvar lead, atualizar lead, viab fibra..
        // Modularizar para permitir voltar ao watson daqui

        response.context.canal = 'whatsapp';
        await this.Context.findOneAndUpdate({ 'context.sender': response.context.sender }, response);

        const payload = [];
        response.output.text.forEach((message) => {
          payload.push({
            preview_url: false,
            to: context.sender,
            type: 'text',
            recipient_type: 'individual',
            text: {
              body: message
            }
          });
        });

        payload.forEach(async (message) => {
          await this.WhatsappController.send(message, response);
        });
      } else {
        // Considerar botar um corpus default (fibra?)
        this.logger.error('Watson configuration not found. Invalid target or incomplete configurations collection.');
      }
    }
  }
}

module.exports = new FlowController();
