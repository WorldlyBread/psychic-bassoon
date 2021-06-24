'use strict';

module.exports = function (next) {
  if (this.isNew) {
    this.CreatedAt = Date.now();
  }
  this.UpdatedAt = Date.now();
  next();
};
