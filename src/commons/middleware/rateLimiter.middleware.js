'use strict';

const { RateLimiter } = require('limiter');
const LIMIT = 100;
const logger = require('../logger/logger');

class RateLimiting {
  constructor() {
    this.limiter = new RateLimiter(LIMIT, 500, true);
    this.index = this.index.bind(this);
  }

  index(req, res, next) {
    try {
      this.limiter.removeTokens(1, function (err, remainingRequests) {
        if (err) {
          console.log(err);
        }
        if (remainingRequests < 60) {
          logger.verbose(`[API] Concurrent users: ${Math.ceil(LIMIT - remainingRequests)}`);
        }

        if (remainingRequests < 1) {
          res.writeHead(429, { 'Content-Type': 'text/plain;charset=UTF-8' });
          res.end('429 Too Many Requests - your IP is being rate limited');
          logger.warn('Possible DDOS attack');
        } else {
          next();
        }
      });
    }
    catch (err) {
      err.type = 'code';
      logger.error('[API][RateLimiter] Error removing token', err);
    }
  }

  initialize() {
    return this.index;
  }
}

module.exports = new RateLimiting();
