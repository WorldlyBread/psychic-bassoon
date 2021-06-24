'use strict';

const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');

class Router {
  constructor() {
    this.cors = require('cors');
    this.limiter = require('../commons/middleware/rateLimiter.middleware')
  }
  initialize(app) {

    const isDirectory = source => lstatSync(source).isDirectory();
    const getDirectories = source => readdirSync(source).filter(name => isDirectory(join(source, name)));
    getDirectories(join(__dirname, 'modules')).forEach(route => {

      app.use(`/api/${route}`, require(`./modules/${route}`));
      app.get('/', (req, res, next) => {
        return res.status(200).json({ status: 200, message: 'online', healthcheck: '/api/healtcheck/test' })
      });
    });
  }
}

module.exports = new Router();
