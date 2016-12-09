require('babel-polyfill')

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development']

module.exports = Object.assign({
  host: process.env.CLIENT_HOST,
  port: process.env.CLIENT_PORT,
  apiHost: process.env.API_PRIVATE_HOSTNAME || 'localhost',
  apiPort: process.env.API_PORT || '3000',
  ledgerUri: process.env.API_LEDGER_URI
}, environment)
