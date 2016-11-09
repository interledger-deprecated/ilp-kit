const crypto = require('crypto')

const env = process.env

if (!env.API_LEDGER_URI) {
  const clientPublicPort = env.CLIENT_PUBLIC_PORT || env.CLIENT_PORT || '80'
  const ledgerPublicPort = (clientPublicPort !== '80' && clientPublicPort !== '443') ? ':' + clientPublicPort : ''

  env.API_PORT = env.API_PORT || clientPublicPort
  env.LEDGER_DB_URI = env.LEDGER_DB_URI || env.API_DB_URI
  env.LEDGER_HOSTNAME = env.LEDGER_HOSTNAME || env.API_HOSTNAME || 'localhost'
  env.LEDGER_PORT = env.LEDGER_PORT || Number(env.API_PORT) + 1
  env.LEDGER_PUBLIC_PORT = env.LEDGER_PUBLIC_PORT || clientPublicPort
  env.LEDGER_PUBLIC_PATH = env.LEDGER_PUBLIC_PATH || 'ledger'
  env.LEDGER_CURRENCY_CODE = env.LEDGER_CURRENCY_CODE || 'USD'
  env.LEDGER_CURRENCY_SYMBOL = env.LEDGER_CURRENCY_SYMBOL || '$'
  env.LEDGER_PUBLIC_HTTPS = env.LEDGER_PUBLIC_HTTPS || !!env.API_PUBLIC_HTTPS
  env.LEDGER_ILP_PREFIX = env.LEDGER_ILP_PREFIX || 'localhost.'
  env.API_LEDGER_ADMIN_USER = env.LEDGER_ADMIN_USER || 'admin'
  env.API_LEDGER_ADMIN_PASS = env.LEDGER_ADMIN_PASS || 'admin'

  const secret = env.API_SECRET || 'secret' // 'secret' for tests

  env.API_ED25519_SECRET_KEY = crypto.createHmac('sha256', secret).update('API_ED25519').digest('base64')
  env.LEDGER_ED25519_SECRET_KEY = crypto.createHmac('sha256', secret).update('LEDGER_ED25519').digest('base64')

  const protocol = env.API_PUBLIC_HTTPS ? 'https:' : 'http:'

  env.API_LEDGER_URI = 'http://' + (env.API_PRIVATE_HOSTNAME || env.LEDGER_HOSTNAME) + ':' + env.LEDGER_PORT
  env.API_LEDGER_PUBLIC_URI = protocol + '//' + env.LEDGER_HOSTNAME + ledgerPublicPort + '/' + env.LEDGER_PUBLIC_PATH
}
