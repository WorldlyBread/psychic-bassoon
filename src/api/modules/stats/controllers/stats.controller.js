'use strict';

class StatsController {
  constructor() {
    this.tweets = require('../../../../models/tweets.model');
    this.logger = require('../../../../commons/logger/logger');
    this.getStats = this.getStats.bind(this);
  }

  getStats(req, res) {
    this.logger.info('GET /stats requested');
    res.json(global.STATS);
  }
}

module.exports = new StatsController();
