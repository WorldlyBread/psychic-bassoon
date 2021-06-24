'use strict';

class SanitizationController {
  constructor() {
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
    this.emoji = require('node-emoji');
    this.dictionary = require('../../models/dictionaries.model');
  }

  _removeEmoji(text) {
    return this.emoji.unemojify(text);
  }

  async _handleRepeatedChar(text) {
    const handleRepeated = async (word) => {
      const knownWord = await this.dictionary.findOne({ word, type: 'repeated' }).lean();
      if (knownWord) {
        if (knownWord.replacement) {
          return knownWord.replacement;
        } else {
          this.logger.info('[HandleRepeatedWord] Manual intervention required on repeated word', knownWord.word);
          return word;
        }
      } else {
        await this.dictionary.create({ word, type: 'repeated' });
        return word;
      }
    };
    text.replace(/\w*(\w)\1{2,}\w+/g, handleRepeated);

    return text;
  }

  async _handleAbbreviations(text) {
    const dict = await this.dictionary.find({ replacement: { $exists: true } }).lean();
    for (let i = 0; i < dict.length; i++) {
      const search = ' ' + dict[i].word + ' ';
      const replaceWith = ' ' + dict[i].replacement + ' ';

      text = text.split(search).join(replaceWith);
    }
    return text;
  }

  handleLaugh(text) {
    text = text.replace(/[kK]{3,}/g, 'haha');
    return text;
  }

  handleUrls(text) {
    // eslint-disable-next-line no-useless-escape
    text = text.replace(/https?:? ?\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi, '');
    return text;
  }

  async handleText(status) {
    const tweets = await this.tweets.find({ status }).limit(10);

    this.logger.info(`[Data Analysis] Analyzing ${tweets.length} tweets in status ${status}`);

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      tweet.originalText = (' ' + tweet.text).slice(1);
      tweet.text = this.handleUrls(tweet.text);
      tweet.text = this._removeEmoji(tweet.text);
      tweet.text = tweet.text.replace(/_/g, ' ').replace(/:/g, ' ');
      tweet.text = tweet.text.toLowerCase();
      tweet.text = this.handleLaugh(tweet.text);
      tweet.text = tweet.text.replace(/(\r\n|\n|\r|\t)/gm, ' ');
      tweet.text = await this._handleRepeatedChar(tweet.text);
      tweet.text = await this._handleAbbreviations(tweet.text);
      tweet.status = 'sanitized';
      tweet.save();
    }
  }
}

module.exports = new SanitizationController();
