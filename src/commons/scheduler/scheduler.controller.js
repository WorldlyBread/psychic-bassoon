'use strict';

const _ = require('lodash');

class Scheduler {
  constructor() {
    this.moment = require('moment');
    this.cron = require('node-cron');
    this.ConfigurationFactory = require('../factories/configuration.factory');
    this.logger = require('../logger/logger');
    this.SchedulerUtils = require('../../commons/utils/scheduler.utils');
  }

  async initialize() {
    await this.ConfigurationFactory.initialize();
    this.updateConfiguration();
    this.runTweetsJob(false, true);
    this.runAnalysisJob(false, false);
    this.dataReviewJob(false, false);
    this.runGetUntranslatedJob(false, false);
    this.runStatsJob(true, true);
    // this.SchedulerUtils.getTones();
  }

  async scheduleJob(cronParam, job) {
    const task = await this.cron.schedule(cronParam, job, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });
    return task;
  }

  async cancelJobs(JobName) {
    this.schedule.cancelJob(JobName);
  }

  async runTweetsJob(enabled = true, scheduled = true) {
    if (enabled) {
      const twitterController = require('../controllers/twitter.controller');
      const TwitterJob = async () => {
        this.logger.info('[Scheduler] Starting Twitter Job');
        await twitterController.getTweetQueries();
        this.logger.info('[Scheduler] Twitter Job finished successfully.');
      };

      if (scheduled) {
        const { TWEET_EXTRACTION_FREQUENCY } = global.CONFIGURATION;
        this.runTweets = await this.scheduleJob(TWEET_EXTRACTION_FREQUENCY, TwitterJob);
      } else {
        TwitterJob();
      }
    }
  }

  async runGetUntranslatedJob(enabled = true, scheduled = true) {
    if (enabled) {
      const GetUntranslatedJob = async () => {
        this.logger.info('[Scheduler] Starting Get Untranslated Words Job');
        await this.SchedulerUtils.getUntranslatedWords();
        this.logger.info('[Scheduler] Get Untranslated Words Job finished successfully.');
      };

      if (scheduled) {
        const { GET_UNTRANSLATED_FREQUENCY } = global.CONFIGURATION;
        this.runUntranslated = await this.scheduleJob(GET_UNTRANSLATED_FREQUENCY, GetUntranslatedJob);
      } else {
        GetUntranslatedJob();
      }
    }
  }

  async runStatsJob(enabled = true, scheduled = true) {
    if (enabled) {
      const StatsJob = async () => {
        this.logger.info('[Scheduler] Starting Update Stats Job');
        await this.SchedulerUtils.getStats();
        this.logger.info('[Scheduler] Update Stats Job finished successfully.');
      };

      if (scheduled) {
        const { GET_STATS_FREQUENCY } = global.CONFIGURATION;
        this.runStats = await this.scheduleJob(GET_STATS_FREQUENCY, StatsJob);
      } else {
        StatsJob();
      }
    }
  }

  async dataReviewJob(enabled = true, scheduled = true) {
    if (enabled && process.env.NODE_ENV !== 'development') {
      const dataReviewController = require('../controllers/dataReview.controller');
      const DataReviewJob = async () => {
        this.logger.info('[Scheduler] Starting Data Review Job');
        await dataReviewController.generateLogs();
        this.logger.info('[Scheduler] Data Review Job completed');
      };
      if (scheduled) {
        const { DATA_REVIEW_FREQUENCY } = global.CONFIGURATION;
        this.runDataReview = await this.scheduleJob(DATA_REVIEW_FREQUENCY, DataReviewJob);
      } else {
        DataReviewJob();
      }
    }
  }

  async runAnalysisJob(enabled = true, scheduled = true) {
    if (enabled) {
      const WatsonController = require('../controllers/ibmwatson.controller');
      const DataJob = async () => {
        this.logger.info('[Scheduler] Starting Data Analysis Job');
        await WatsonController.runDataAnalysis();
        this.logger.info('[Scheduler] Data analysis Job finished successfully.');
      };

      if (scheduled) {
        const { TWEET_EXTRACTION_FREQUENCY } = global.CONFIGURATION;
        this.runAnalysis = await this.scheduleJob(TWEET_EXTRACTION_FREQUENCY, DataJob);
      } else {
        DataJob();
      }
    }
  }

  async updateConfiguration(enabled = true, scheduleOn = true) {
    if (enabled) {
      const UpdateConfigurationJob = async () => {
        const currentConfig = global.CONFIGURATION;
        await this.ConfigurationFactory._CreateConfiguration();
        const newConfig = global.CONFIGURATION;
        const configKeys = _.keys(global.CONFIGURATION);

        for (let job of configKeys) {
          switch (job) {
            case 'TWEET_EXTRACTION_FREQUENCY':
              if (currentConfig.TWEET_EXTRACTION_FREQUENCY !== newConfig.TWEET_EXTRACTION_FREQUENCY) {
                this.runTweets.destroy();
                this.runTweetsJob();
              }
              break;
            case 'CHECK_CONFIG_FREQUENCY':
              if (currentConfig.CHECK_CONFIG_FREQUENCY !== newConfig.CHECK_CONFIG_FREQUENCY) {
                this.checkConfig.destroy();
                this.updateConfiguration();
              }
              break;
            case 'DATA_ANALYSIS_FREQUENCY':
              if (currentConfig.DATA_ANALYSIS_FREQUENCY !== newConfig.DATA_ANALYSIS_FREQUENCY) {
                this.runAnalysis.destroy();
                this.runAnalysisJob();
              }
              break;
            case 'DATA_REVIEW_FREQUENCY':
              if (currentConfig.DATA_REVIEW_FREQUENCY !== newConfig.DATA_REVIEW_FREQUENCY) {
                this.runDataReview.destroy();
                this.dataReviewJob();
              }
              break;
            case 'GET_STATS_FREQUENCY':
              if (currentConfig.GET_STATS_FREQUENCY !== newConfig.GET_STATS_FREQUENCY) {
                this.runStats.destroy();
                this.runStatsJob();
              }
              break;
            case 'GET_UNTRANSLATED_FREQUENCY':
              if (currentConfig.GET_UNTRANSLATED_FREQUENCY !== newConfig.GET_UNTRANSLATED_FREQUENCY) {
                this.runUntranslated.destroy();
                this.runGetUntranslatedJob();
              }
              break;
            default:
              break;
          }
        }
      };

      UpdateConfigurationJob();
      if (scheduleOn) {
        const { CHECK_CONFIG_FREQUENCY } = global.CONFIGURATION;
        this.checkConfig = await this.scheduleJob(CHECK_CONFIG_FREQUENCY, UpdateConfigurationJob);
      }
    }
  }
}
module.exports = new Scheduler();
