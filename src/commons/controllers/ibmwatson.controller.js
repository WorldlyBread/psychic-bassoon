'use strict';

class IBMController {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.api_key = process.env.WATSON_ASSISTANT_API_KEY;
    this.assistant_id = process.env.WATSON_ASSISTANT_ASSISTANT_ID;
    this.version = process.env.WATSON_ASSISTANT_VERSION;
    this.baseUrl = process.env.WATSON_ASSISTANT_URL;
    this.tweets = require('../../models/tweets.model');
    this.sanitizationController = require('./sanitization.controller');
    this.googleController = require('./google.controller');
  }

  /** @description Calls Watson Language Translator and returns string of translated text */
  async translate(text) {
    try {
      const res = await this.axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        url: `${process.env.WATSON_TRANSLATOR_URL}/v3/translate?version=${process.env.WATSON_TRANSLATOR_VERSION}`,
        auth: {
          username: 'apikey',
          password: process.env.WATSON_TRANSLATOR_API_KEY
        },
        data: {
          text,
          model_id: 'pt-en'
        }
      });

      if (res.data && res.data.translations && res.data.translations.length > 0) {
        return res.data.translations[0].translation;
      } else {
        this.logger.warn(`[Translate] No translations found for: ${text}`);
        return '';
      }
    } catch (err) {
      this.logger.error('[Watson Translation]', err);
      return '';
    }
  }

  /** @description Calls Watson Tone Analyzer and returns array of tones */
  async analyzeTone(text) {
    try {
      const res = await this.axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        url: `${process.env.WATSON_TONE_URL}/v3/tone?version=${process.env.WATSON_TONE_VERSION}`,
        auth: {
          username: 'apikey',
          password: process.env.WATSON_TONE_API_KEY
        },
        data: {
          text
        }
      });

      if (res.data.document_tone && res.data.document_tone.tones) {
        return res.data.document_tone.tones;
      } else {
        this.logger.warn(`[Tone Analysis] No tone found for ${text}`);
        return [];
      }
    } catch (err) {
      this.logger.error('[Tone Analysis] Error occurred', err);
      return [];
    }
  }

  /** @description Sends message to Watson Assistant */
  async sendMessage(text) {
    try {
      const res = await this.axios({
        method: 'post',
        headers: { 'content-type': 'application/json' },
        url: `${this.baseUrl}/v2/assistants/${this.assistant_id}/message/?version=${this.version}`,
        auth: {
          username: 'apikey',
          password: this.api_key
        },
        data: {
          input: {
            message_type: 'text',
            text,
            options: {
              alternate_intents: true,
              return_context: false
            }
          }
        }
      });

      const { entities, intents } = res.data.output;
      return { entities, intents };
    } catch (err) {
      this.logger.error('[Error] [SendMessage]', err);
      return { entities: [], intents: [] };
    }
  }

  async analyzeSentiment(text) {

    try {
      const res = await this.axios({
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        url: `${process.env.WATSON_NLU_URL}/v1/analyze?version=${process.env.WATSON_NLU_VERSION}`,
        auth: {
          username: 'apikey',
          password: process.env.WATSON_NLU_API_KEY
        },
        data: {
          features: {
            sentiment: {
              targets: [text]
            }
          },
          text
        }
      });

      const { sentiment } = res.data;

      this.logger.info('[Kibana] Sentiment review', {
        nluText: text,
        nluScore: sentiment.targets[0].score,
        nluLabel: sentiment.targets[0].label
      });

      return {
        score: sentiment.targets[0].score,
        label: sentiment.targets[0].label
      };
    } catch (err) {
      this.logger.error('[Error] [NLU]', err);
      return { sentiment: {} };
    }
  }

  /** @description Calls Watson Assistant for every tweet in the correct status (default: sanitized) */
  async runAssistant(status) {
    const tweets = await this.tweets.find({ status });
    if (tweets.length > 0) {
      this.logger.info(`[Data Analysis] Analyzing ${tweets.length} tweets in status ${status}`);

      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        const res = await this.sendMessage(tweet.text);
        tweet.watsonEntities = res.entities;
        tweet.intents = res.intents;
        tweet.status = 'assistant';
        await tweet.save();
      }
    }
  }

  /** @description Calls Watson Language Translation and Google Translation for every tweet in the correct status (default: assistant) */
  async runTranslate(status) {
    const tweets = await this.tweets.find({ status });
    this.logger.info(`[Data Analysis] Analyzing ${tweets.length} tweets in status ${status}`);
    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      tweet.watsonTranslation = await this.translate(tweet.text);
      // tweet.googleTranslation = await this.googleController.googleTranslate(tweet.text);
      tweet.status = 'translated';
      await tweet.save();
    }
  }

  /** @description Calls Watson Tone Analyzer for every tweet in the correct status (default: translated) */
  async runToneAnalyzer(status) {
    const tweets = await this.tweets.find({ status });
    this.logger.info(`[Data Analysis] Analyzing ${tweets.length} tweets in status ${status}`);
    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      tweet.tones = await this.analyzeTone(tweet.watsonTranslation);
      tweet.status = 'tone';
      await tweet.save();
    }
  }

  async runNLU(status) {
    const tweets = await this.tweets.find({ status }).limit(2000);
    this.logger.info(`[Data Analysis] Analyzing ${tweets.length} tweets in status ${status}`);
    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      tweet.sentiment = await this.analyzeSentiment(tweet.text);
      tweet.status = 'understood';
      await tweet.save();
    }
  }

  /** @description Runs through all the data analysis steps: Sanitizes data, translates it and fetches sentiment and opinion data for all new tweets */
  async runDataAnalysis() {
    // await this.sanitizationController.handleText('raw');
    // await this.runAssistant('sanitized');
    // await this.runTranslate('assistant');
    // await this.runToneAnalyzer('translated');
    await this.runNLU('tone');
  }
}

module.exports = new IBMController();
