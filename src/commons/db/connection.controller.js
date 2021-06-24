'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

/**
* Responsible for database connection
*/
class ConnectionController {
  constructor() {
    this.dbHost = process.env.DB_HOST;
    this.dbPort = process.env.DB_PORT;
    this.dbUser = process.env.DB_USER;
    this.dbPass = process.env.DB_PASS;
    this.dbName = process.env.DB_NAME;
    this.dbAuth = process.env.DB_AUTH === '1';
    this.dbAuthSrc = process.env.DB_AUTH_SRC;
    this.dbReplicaSet = process.env.DB_REPLICASET === 'true';
    this.dbReplicaSetName = process.env.DB_REPLICASET_NAME;
    this.dbReplicaSetHost = process.env.DB_REPLICASET_HOST;
    this.logger = require('../logger/logger');
  }

  getDatabase(name) {
    return this.connection.useDb(name);
  }

  gracefulShutdown(msg, cb) {
    mongoose.connection.close(() => {
      this.logger.info('Mongoose disconnected through', msg);
      cb();
    });
  }

  /**
  * Register database connection events
  * @param {mongodb connection url} connectionUrl
  */
  _registerConnectionEvents() {
    const logger = this.logger;
    mongoose.connection.once('open', () => {
      logger.info('MongoDB connected');
      if (process.send) {
        process.send('ready');
      }

      mongoose.connection.on('disconnected',
        () => logger.info('MongoDB disconnected'));

      mongoose.connection.on('reconnected',
        () => logger.warn('MongoDB event reconnected'));

      mongoose.connection.on('error',
        err => {
          err.type = 'mongodb';
          logger.error('MongoDB event error: ', err);
        });
    });
  }

  _getLogSafeUrl(connectionUrl) {
    let logSafeUrl = '', urlArr = connectionUrl.split(':'), passwordChunkArr = urlArr[2].split('@');

    passwordChunkArr[0] = 'xxxxxx';
    urlArr[2] = passwordChunkArr.join('@');
    logSafeUrl = urlArr.join(':');
    return logSafeUrl;
  }

  /**
  * Connects to mongodb
  */
  async connect() {
    try {
      const connectionUrl = process.env.MONGODB_CONNECTION_STRING;
      let logSafeUrl = '';

      if (this.dbAuth) {
        logSafeUrl = this._getLogSafeUrl(connectionUrl);
      } else {
        logSafeUrl = connectionUrl;
      }

      this.logger.info(`Connecting to mongo url: ${logSafeUrl}`);
      this._registerConnectionEvents();

      process.on('SIGINT', () => {
        this.gracefulShutdown('API termination', () => process.exit(0));
      });

      const conn = await mongoose.connect(connectionUrl, {
        useNewUrlParser: true,
        // autoReconnect: true,
        // reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        // reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 10, // Maintain up to 10 socket connections
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0,
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        useUnifiedTopology: true
      });

      this.connection = conn.connection;
    } catch (err) {
      err.type = 'mongodb';
      this.logger.error('MongoDB connection error:', err);
      throw err;
    }
  }

  hasConnection() {
    return this.connection.readyState === 1;
  }

  disconnect() {
    return mongoose.disconnect();
  }
}

module.exports = new ConnectionController();
