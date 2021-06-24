'use strict';

class SchedulerUtils {
  constructor() {
    this.Tweets = require('../../models/tweets.model');
    this.Dictionary = require('../../models/dictionaries.model');
    this.logger = require('../logger/logger');
    this.moment = require('moment-timezone');
    this.Ips = require('../../models/ips.model');
  }

  async getUntranslatedWords() {
    const tweets = await this.Tweets.find({ checked: false, 'voting.selected.0': { $exists: true, $not: { $size: 0 } } });
    let counter = 0;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

      const { selected } = tweet.voting;
      console.log(selected);
      const list = [];
      selected.forEach(vote => {
        vote.forEach(word => {
          if (list.indexOf(word) === -1) {
            list.push(word);
          }
        });
      });

      for (let i = 0; i < list.length; i++) {
        const word = list[i];
        const knownWord = await this.Dictionary.countDocuments({ word }).lean();
        if (!knownWord) {
          await this.Dictionary.create({
            word,
            type: 'untranslated'
          });
          counter += 1;
        }
      }

      tweet.checked = true;
      await tweet.save();
    }

    this.logger.info(`[GetUntranslatedJob] ${counter} words added out of ${tweets.length} analyzed.`);
  }

  async getStats() {
    const stats = {
      fetched: await this.Tweets.countDocuments({ 'voting.fetched': { $gt: 0 } }),
      total: await this.Tweets.countDocuments({}),
      replacedWords: await this.Dictionary.countDocuments({
        $or: [
          { replacement: { $exists: true } },
          {
            $and:
              [
                { ignore: { $exists: true } }, { ignore: true }
              ]
          }
        ]
      }),
      wordsTotal: await this.Dictionary.countDocuments({}),
      volunteers: await this.Ips.countDocuments({}),
      lastUpdate: this.moment.tz('America/Sao_Paulo').format('HH:mm:SS DD/MM/YYYY')
    };
    global.STATS = stats;

    this.logger.info('Global stats updated', global.STATS);
  }

  async getTones() {
    const choices = ['Anger', 'Fear', 'Joy', 'Sadness', 'Analytical', 'Confident', 'Tentative'];
    choices.forEach(async choice => this.getTone(choice));
  }

  async getTone(choice) {
    const res = [];
    const tones = await this.Tweets.find({ 'voting.fetched': { $gt: 0 }, 'tones.0': { $exists: true } }, { 'tones': 1, '_id': 0 }).lean();

    for (let i = 0; i < tones.length; i++) {
      const analyzedTweet = tones[i].tones;

      analyzedTweet.forEach(item => {
        if (item.tone_name === choice) {
          res.push(item);
        }
      });
    }

    this.logger.info({
      tone: choice,
      quantity: res.length
    });
  }
}

module.exports = new SchedulerUtils();
