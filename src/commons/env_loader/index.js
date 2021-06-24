class EnvLoader {
  constructor(envpath) {
    this.envpath = envpath;
    this.fs = require('fs');
    this.dotenv = require('dotenv');
    this.env = this.checkEnv();
    this.loadEnv();
  }

  loadEnv() {
    const envConfig = this.dotenv.parse(this.fs.readFileSync(this.env));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }

  checkEnv() {
    console.log(process.env.NODE_ENV);
    switch (process.env.NODE_ENV) {
      case 'development':
        return `${this.envpath}/.env.development`;
      case 'production':
        return `${this.envpath}/.env.production`;
      case 'local':
        return `${this.envpath}/.env.local`;
      case 'testing':
        return `${this.envpath}/.env.testing`;
      default:
        console.log('Case: Default');
        return `${this.envpath}/.env.local`;
    }
  }
}

module.exports = EnvLoader;
