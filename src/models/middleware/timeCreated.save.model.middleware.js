'use strict';

module.exports = function(next) {
  if (this.isNew) {
    this.TimeCreated = Date.now();
  }
  next();
};
