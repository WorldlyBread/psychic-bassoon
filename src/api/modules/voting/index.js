'use strict';

const BaseRouter = require('../../../commons/router/base.router');
const VotingController = require('./controllers/voting.controller');

class VotingRouter extends BaseRouter {
  initialize() {
    this.post('/getQuestions', VotingController.getQuestions);
    this.post('/saveQuestion', VotingController.saveQuestion);
  }
}

module.exports = new VotingRouter().getRouter();
