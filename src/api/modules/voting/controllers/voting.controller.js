'use strict';

class VotingController {
  constructor() {
    this.tweets = require('../../../../models/tweets.model');
    this.logger = require('../../../../commons/logger/logger');
    this.ips = require('../../../../models/ips.model');
    this.getQuestions = this.getQuestions.bind(this);
    this.saveQuestion = this.saveQuestion.bind(this);
  }

  async storeIp(ip) {
    const crypto = require('crypto');

    const secret = process.env.SHA_SECRET;
    const hash = crypto.createHmac('sha256', secret)
      .update(ip)
      .digest('hex');
    console.log(hash);

    await this.ips.findOneAndUpdate({ IP: hash }, { $inc: { Access: 1 } }, { upsert: true });
  }

  async getQuestions(req, res, next) {
    this.logger.info('POST /getQuestions received');
    const { ids } = req.body;

    await this.storeIp(req.connection.remoteAddress);

    const list = await this.tweets.find({ status: 'understood' }).sort({ 'voting.fetched': 0 }).limit(5).lean();
    let filteredList = [];
    list.map(item => {
      filteredList.push({
        text: item.originalText,
        watsonTranslation: item.watsonTranslation,
        id: item.id
      });
    });

    if (ids) {
      filteredList = filteredList.filter(item => ids.indexOf(item.id) === -1);
    }

    res.json(filteredList);
  }

  async saveQuestion(req, res, next) {
    this.logger.info('POST /saveQuestion received');
    res.json(200);

    const { data, id } = req.body;
    const list = ['theme', 'telecom', 'consumer', 'alternativeTheme', 'translation', 'company', 'alternativeCompany', 'selected', 'clicked'];

    Object.keys(data).forEach(name => {
      if (list.indexOf(name) === -1) {
        res.json(new Error('INVALID_PARAMS'));
      }
    });

    console.log(data);

    if (!id || !data) throw new Error('INVALID_PARAMS');

    const tweet = await this.tweets.findOne({ id });

    if (!tweet.voting) {
      tweet.voting = {};
    }

    Object.keys(data).forEach(item => {
      if (data[item] !== undefined) {
        if (tweet.voting[item]) {
          tweet.voting[item].push(data[item]);
        } else {
          tweet.voting[item] = [data[item]];
        }
      }
    });

    tweet.voting.fetched += 1;
    await tweet.save();
  }
}

module.exports = new VotingController();
