'use strict';

const BaseRouter = require('../../../commons/router/base.router');
const WordsController = require('./controllers/words.controller');

class WordsRouter extends BaseRouter {
  initialize() {
    this.post('/getWords', WordsController.getWords);
    this.post('/saveWord', WordsController.saveWord);
  }
}

module.exports = new WordsRouter().getRouter();
