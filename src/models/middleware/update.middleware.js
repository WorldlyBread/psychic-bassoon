'use strict';

module.exports = function (next) {
  this.UpdatedAt = Date.now();
  next();
};
