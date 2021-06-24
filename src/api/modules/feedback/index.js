'use strict';

const BaseRouter = require('../../../commons/router/base.router');
const FeedbackController = require('./controllers/feedback.controller');

class FeedbackRouter extends BaseRouter {
  initialize() {
    this.post('/', FeedbackController.saveFeedback);
  }
}

module.exports = new FeedbackRouter().getRouter();
