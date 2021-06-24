'use strict';

const { Translate, TranslateOptions } = require('@google-cloud/translate').v2;

class GoogleController {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
  }

  /** @description Calls Google Translate and returns string of translated text */
  async googleTranslate(text) {
    try {
      let translate = new Translate();
      translate = TranslateOptions.getDefaultInstance().getService();

      let [translations] = await translate.translate(text, 'en');

      this.logger.info('Google Translation: ', translations);

      if (translations) {
        return translations;
      } else {
        return '';
      }
    } catch (err) {
      this.logger.error('[Google Translation] Error occurred:', err);
      return '';
    }
  }
}

module.exports = new GoogleController();
