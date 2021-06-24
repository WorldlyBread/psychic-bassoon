'use strict';

const path = require('path');

class SeedFactory {
  constructor() {
    this.fs = require('fs');
    this.logger = require('../logger/logger');
    this.timers = require('../../models/timers.model');
    this.config = require('../../models/config.model');
    this.dictionary = require('../../models/dictionaries.model');
  }

  async initialize() {
    const timers = await this.timers.findOne({});
    if (timers.POPULATE_DB) {
      let dictSeed = this.fs.readFileSync(path.resolve(__dirname, '../../seeds/dict_seed.json'));
      dictSeed = JSON.parse(dictSeed);
      await this.dictionary.insertMany(dictSeed.data);

      let configSeed = this.fs.readFileSync(path.resolve(__dirname, '../../seeds/config_seed.json'));
      configSeed = JSON.parse(configSeed);
      await this.config.insertMany(configSeed.data);

      timers.POPULATE_DB = false;
      await timers.save();
    }
  }
}

module.exports = new SeedFactory();
