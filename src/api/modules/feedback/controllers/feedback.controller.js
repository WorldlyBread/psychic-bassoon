'use strict';

class FeedbackController {
  constructor() {
    this.Feedback = require('../../../../models/feedback.model');
    this.logger = require('../../../../commons/logger/logger');
    this.saveFeedback = this.saveFeedback.bind(this);
  }

  async saveFeedback(req, res, next) {
    this.logger.info('POST /feedback requested');

    const { feedback } = req.body;

    if (feedback && typeof feedback === 'string') {
      await this.Feedback.create({ feedback: feedback });
    }

    res.json(200);
    next();
  }
}

module.exports = new FeedbackController();
