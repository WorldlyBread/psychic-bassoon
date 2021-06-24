'use strict';

class DataReviewController {
  constructor() {
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
    this.configurations = require('../../models/config.model');
  }

  async getTweetsStatus() {
    const fetched = await this.tweets.countDocuments({ 'voting.fetched': { $gt: 0 } });
    const status = await this.tweets.aggregate(
      [
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]
    );

    const result = {};
    Object.keys(status).forEach(item => {
      result[status[item]._id] = status[item].count;
    });

    this.logger.info('Status', {
      fetched: fetched,
      ...result
    });
  }

  /** Gets intents from 2 sources:
 * - Intents identified by Watson Assistant
 * - Intents voted by users on the form (question 3)
 * Only the top 2 intents are considered
 */
  async getIntents(tweet) {
    const mainIntent = tweet.intents[0];
    const intentAnalysis = {};

    intentAnalysis.intent = mainIntent.intent;
    intentAnalysis.intentConfidence = mainIntent.confidence;

    if (tweet.voting && tweet.voting.fetched > 0) {
      if (tweet.voting.fetched === 1) { // One response
        intentAnalysis.userIntent = tweet.voting.theme[0] ? tweet.voting.theme[0].toLowerCase() : tweet.voting.theme[0];
      } else {
        const votes = tweet.voting.theme;
        const counts = {};

        votes.forEach(vote => {
          !counts[vote] ? counts[vote] = 1 : counts[vote] += 1;
        });

        const mostVotedTheme = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        intentAnalysis.userIntent = mostVotedTheme.toLowerCase();
        intentAnalysis.certainty = counts[mostVotedTheme] / votes.length;
      }
    }

    return intentAnalysis;
  }

  _findMeaning(type, mainTone, alternateTone = '') {
    const tonesMeaning = [
      { name: 'Joy', meaning: 'happy' },
      { name: 'Anger', meaning: 'unhappy' },
      { name: 'Sadness', meaning: 'unhappy' },
      { name: 'Fear', meaning: 'unhappy' }
    ];

    const themesMeaning = [
      { name: 'Elogio', meaning: 'happy' },
      { name: 'Outro', meaning: 'other' }
    ];

    if (type === 'watson') {
      const match = tonesMeaning.find(tone => tone.name === mainTone || tone.name === alternateTone);
      return match ? match.meaning : 'other';
    } else {
      const match = themesMeaning.find(tone => tone.name === mainTone || tone.name === alternateTone);
      return match ? match.meaning : 'unhappy';
    }
  }

  /**
   * Gets tones from 2 sources:
   * - Tones identified by Watson Tone Analyser
   * - Responses from users from the form (question 3)
   * Classifies tones into "happy", "unhappy" and "other"
   */
  async getTones(tweet) {
    const toneAnalysis = {};
    if (tweet.tones && tweet.tones.length > 0) {
      tweet.tones.sort((a, b) => a.score - b.score);

      toneAnalysis.mainTone = tweet.tones[0].tone_name;
      toneAnalysis.mainScore = tweet.tones[0].score;
      toneAnalysis.watsonSentiment = this._findMeaning('watson', tweet.tones[0].tone_name, tweet.tones[0].tone_name ? tweet.tones[0].tone_name : '');

      if (tweet.tones.length > 1) {
        toneAnalysis.secondaryTone = tweet.tones[1].tone_name;
        toneAnalysis.secondaryScore = tweet.tones[1].score;
      }
    }

    if (tweet.voting && tweet.voting.fetched > 0) {
      if (tweet.voting.fetched === 1) { // Only one answer
        toneAnalysis.userSentiment = this._findMeaning('user', tweet.voting.theme[0]);
      } else { // Multiple answers
        // voting: {theme: ['aaaaa', 'bbbb', 'aaa']}

        const votes = tweet.voting.theme;
        const counts = {};

        votes.forEach(vote => {
          !counts[vote] ? counts[vote] = 1 : counts[vote] += 1;
        });

        const mostVotedTheme = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        toneAnalysis.userTone = mostVotedTheme;
        toneAnalysis.certainty = counts[mostVotedTheme] / votes.length;
        toneAnalysis.userSentiment = this._findMeaning('user', mostVotedTheme);
      }
    }

    return toneAnalysis;
  }

  /** Gets entities from 3 sources:
   * - Responses from users in the form (question 4)
   * - Query used to fetch the tweet
   * - Entity identified by Watson Assistant
   */
  async getEntities(tweet) {
    const config = await this.configurations.find({}, { _id: 0, query: 1, company: 1, exclude: 1 }).lean();

    config.map(item => {
      if (item.exclude && item.exclude.length > 0) {
        item.query += ' -"' + item.exclude[0] + '"';
      }
      item.query += ' AND -filter:retweets';
      return item;
    });

    const entityAnalysis = {
      originalText: tweet.originalText
    };

    // Entities based on the query used to fetch the tweet
    const company = config.find(item => item.query === tweet.query);
    entityAnalysis.query = company ? company.company : tweet.query;

    // Entities informed by users
    if (tweet.voting && tweet.voting.fetched > 0) {
      if (tweet.voting.fetched === 1) { // Only one answer
        entityAnalysis.userCompany = tweet.voting.company[0];
      } else { // Multiple answers
        const votes = tweet.voting.company;
        const counts = {};

        votes.forEach(vote => {
          !counts[vote] ? counts[vote] = 1 : counts[vote] += 1;
        });

        const mostVoted = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        entityAnalysis.userCompany = mostVoted;
        entityAnalysis.certainty = counts[mostVoted] / votes.length;
      }
    }

    // Entities identified by Watson Assistant
    if (tweet.watsonEntities && tweet.watsonEntities.length > 0) {
      entityAnalysis.watsonEntities = tweet.watsonEntities[0].entity;
      entityAnalysis.watsonConfidence = tweet.watsonEntities[0].confidence;
    } else {
      entityAnalysis.watsonEntity = '';
    }

    return entityAnalysis;
  }

  _findMostVoted(list, obj, value, percentage) {
    const counts = {};

    if (list && list.length > 0) {
      list.forEach(vote => {
        !counts[vote] ? counts[vote] = 1 : counts[vote] += 1;
      });

      const mostVotedTheme = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      obj[value] = mostVotedTheme;
      obj[percentage] = counts[mostVotedTheme] / list.length;
    }
  }

  async getOtherAnswers(tweet) {
    const answers = {};
    if (tweet.voting && tweet.voting.fetched > 0) {
      if (tweet.voting.fetched === 1) { // Only one answer
        answers.translationScore = tweet.voting.translation !== undefined ? tweet.voting.translation[0] : '';
        answers.telecom = tweet.voting.telecom !== undefined ? tweet.voting.telecom[0] : '';
        answers.consumer = tweet.voting.consumer !== undefined ? tweet.voting.consumer[0] : '';
        answers.alternativeCompany = tweet.voting.alternativeCompany !== undefined ? tweet.voting.alternativeCompany[0] : '';
        answers.alternativeTheme = tweet.voting.alternativeTheme !== undefined ? tweet.voting.alternativeTheme[0] : '';
        answers.alternativeTranslationCount = (tweet.voting.selected !== undefined && tweet.voting.selected[0] !== undefined) ? tweet.voting.selected[0].length : 0;
        answers.hasAlternativeTranslation = tweet.voting.selected !== undefined ? tweet.voting.selected.length : 0;
      } else {
        this._findMostVoted(tweet.voting.translation, answers, 'translationScore', 'translationScore_per');
        this._findMostVoted(tweet.voting.telecom, answers, 'telecom', 'telecom_per');
        this._findMostVoted(tweet.voting.consumer, answers, 'consumer', 'consumer_per');
        this._findMostVoted(tweet.voting.alternativeCompany, answers, 'alternativeCompany', 'alternativeCompany_per');
        this._findMostVoted(tweet.voting.alternativeTheme, answers, 'alternativeTheme', 'alternativeTheme_per');
      }
    }

    return answers;
  }

  async generateLogs() {
    await this.getTweetsStatus();

    const tweets = await this.tweets.find({ status: 'tone' }).limit(1).lean();

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

      const intent = await this.getIntents(tweet);
      const tone = await this.getTones(tweet);
      const entity = await this.getEntities(tweet);
      const otherAnswers = await this.getOtherAnswers(tweet);

      const data = {
        originalText: tweet.originalText,
        createdAt: tweet.createdAt,
        lastAnswer: tweet.updatedAt,
        ...intent,
        ...tone,
        ...entity,
        ...otherAnswers
      };

      this.logger.info('[Data Analysis]', data);
    }
  }
}

module.exports = new DataReviewController();
