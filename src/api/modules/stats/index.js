'use strict';

const BaseRouter = require('../../../commons/router/base.router');
const StatsController = require('./controllers/stats.controller');

class StatsRouter extends BaseRouter {
  initialize() {
    this.get('/', StatsController.getStats);
  }
}

module.exports = new StatsRouter().getRouter();
