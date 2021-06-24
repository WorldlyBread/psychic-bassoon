'use strict';

const logger = require('../../../commons/logger/logger');
const BaseRouter = require('../../../commons/router/base.router');
const connectionController = require('../../../commons/db/connection.controller');

class LoopbackRouter extends BaseRouter {
  initialize() {
    this.get('/test', async (req, res) => {
      logger.info('Healthcheck requested...');
      const data = await this.healthCheck();
      logger.info('Healthcheck data:', data);
      res.write(JSON.stringify(data, null, 2));
      res.end();
    });
  }

  async healthCheck() {
    return {
      mongo: connectionController.hasConnection()
    };
  }
}

module.exports = new LoopbackRouter().getRouter();
