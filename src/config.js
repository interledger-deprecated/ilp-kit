require('babel/polyfill');

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development'];

module.exports = Object.assign({
  host: process.env.CLIENT_HOST,
  port: process.env.CLIENT_PORT,
  apiHost: process.env.API_HOSTNAME,
  apiPort: process.env.API_PORT,
  app: {
    title: 'Five Bells Ledger UI',
    description: '',
    meta: {
      charSet: 'utf-8'
    }
  },
  public: {
    sentryUri: process.env.SENTRY_URI
  }
}, environment);
