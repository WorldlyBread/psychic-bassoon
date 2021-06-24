'use strict';

class WordsController {
  constructor() {
    this.Dictionary = require('../../../../models/dictionaries.model');
    this.logger = require('../../../../commons/logger/logger');
    this.getWords = this.getWords.bind(this);
    this.saveWord = this.saveWord.bind(this);
  }

  async getWords(req, res, next) {
    this.logger.info('POST /getWords received');
    const { ids } = req.body;

    const list = await this.Dictionary.find({
      $and: [
        { replacement: { $exists: false } },
        {
          $and:
            [
              { ignore: { $exists: true } }, { ignore: false }
            ]
        }
      ]
    }).limit(10).lean();
    let filteredList = [];
    list.map(item => {
      filteredList.push({
        word: item.word,
        type: item.type,
        id: item._id.toString()
      });
    });

    if (ids) {
      filteredList = filteredList.filter(item => ids.indexOf(item.id) === -1);
    }

    res.json(filteredList);
  }

  async saveWord(req, res, next) {
    this.logger.info('POST /saveWord received');
    res.json(200);

    const { data } = req.body;

    console.log(data);

    if (!data) throw new Error('INVALID_PARAMS');

    const word = await this.Dictionary.findOne({ '_id': data.id });

    if (word) {
      if (!data.ignore) {
        word.replacement = data.replacement;
      } else {
        word.ignore = true;
        word.reason = data.reason;
      }
      await word.save();
    } else {
      this.logger.error(`[SaveWord] Invalid word ${data.word} sent`);
    }
  }
}

module.exports = new WordsController();
