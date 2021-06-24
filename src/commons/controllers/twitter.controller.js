'use strict';

const Twitter = require('twitter');

class TwitterController {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.api_key = process.env.TWITTER;
    this.baseUrl = process.env.TWITTER_URL;
    this.consumerApiKey = process.env.TWITTER_CONSUMER_API_KEY;
    this.consumerSecret = process.env.TWITTER_CONSUMER_API_SECRET_KEY;
    this.accessToken = process.env.TWITTER_ACCESS_TOKEN;
    this.accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    this.tweets = require('../../models/tweets.model');
    this.config = require('../../models/config.model');
  }

  /** Formats configuration into a twitter query */
  _formatQuery(document) {
    let q = document.query;
    if (document.exclude && document.exclude.length > 0) {
      document.exclude.forEach(item => {
        // eslint-disable-next-line quotes
        q += ' -"' + item + '"';
      });
    }
    q += ' AND -filter:retweets';
    return q;
  }

  /** Gets queries from the configurations collection and calls getTweets for each one */
  async getTweetQueries() {
    const list = await this.config.find({}).lean();
    list.forEach(async item => {
      await this.getTweets(this._formatQuery(item));
    });
  }

  /** Calls Twitter API and searches tweets based on a given query.
   * All new tweets are then added to the DB. A log is generated indicating a new/repeated count */
  async getTweets(query) {
    var client = new Twitter({
      consumer_key: this.consumerApiKey,
      consumer_secret: this.consumerSecret,
      access_token_key: this.accessToken,
      access_token_secret: this.accessSecret
    });

    const count = {
      new: 0,
      repeat: 0
    };

    const self = this;

    client.get('search/tweets', {
      q: query,
      result_type: 'mixed',
      count: 100,
      lang: 'pt',
      tweet_mode: 'extended'
    }, async function (error, tweets, response) {
      if (tweets && tweets.statuses) {
        for (let i = 0; i < tweets.statuses.length; i++) {
          const item = tweets.statuses[i];

          const tweet = {};
          tweet['status'] = 'raw';
          tweet['query'] = query;
          tweet['id'] = item['id_str'];
          tweet['created_at'] = item['created_at'];
          tweet['text'] = item['full_text'];
          tweet['entities'] = item['entities'];
          tweet['language'] = item['lang'];
          tweet['user_id'] = item['user']['id_str'];
          tweet['followers_count'] = item['user']['followers_count'];
          tweet['friends_count'] = item['user']['friends_count'];
          tweet['place'] = item['place'];
          tweet['verified'] = item['user']['verified'];
          tweet['retweet_count'] = item['retweet_count'];
          tweet['favorite_count'] = item['favorite_count'];

          const exists = await self.tweets.countDocuments({ id: tweet.id });

          if (exists) {
            count.repeat += 1;
          } else {
            count.new += 1;
            await self.tweets.create(tweet);
          }
        }
      } else {
        self.logger.warn('[Twitter] No tweets found', tweets);
      }
      count.query = query;

      self.logger.info('[Twitter]', count);

      if (error) {
        self.logger.error(error);
      }
    });
  }
}

module.exports = new TwitterController();
