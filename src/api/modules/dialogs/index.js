'use strict';

const BaseRouter = require('../../../commons/router/base.router');
const DialogsController = require('./controllers/dialogs.controller');

class VotingRouter extends BaseRouter {
  initialize() {
    this.post('/whatsapp/enviar', DialogsController.sendMessage);
  }
}

module.exports = new VotingRouter().getRouter();
