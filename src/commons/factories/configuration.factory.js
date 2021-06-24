'use strict';

class ConfigurationFactory {
  constructor() {
    this.timers = require('../../models/timers.model');
    this.logger = require('../logger/logger');
  }

  async initialize() {
    await this._CreateConfiguration();
  }

  async updateConfiguration(Params) {
    const Configuration = await this.timers.findOneAndUpdate(Params).lean();
    global.CONFIGURATION = Configuration;
  }

  async _CreateConfiguration() {
    const Configuration = (await this.timers.findOne({}).lean()) || (await this.timers.create({}));
    global.CONFIGURATION = Configuration;
    this.logger.verbose('Configuration updated');
  }
}

module.exports = new ConfigurationFactory();
