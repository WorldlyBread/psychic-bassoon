'use strict';

class HttpController {
  constructor() {
    this.moment = require('moment');
    this.logger = require('../logger/logger');
    this.HttpError = require('../utils/http.error');
  }
}

module.exports = HttpController;
