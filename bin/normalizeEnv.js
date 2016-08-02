const env = process.env

if (!env.API_LEDGER_URI) {
  const clientPublicPort = env.CLIENT_PUBLIC_PORT || env.CLIENT_PORT
  const ledgerPublicPort = (clientPublicPort !== '80' && clientPublicPort !== '443') ? ':' + clientPublicPort : ''

  env.LEDGER_DB_URI = env.LEDGER_DB_URI || env.API_DB_URI + '-ledger'
  env.LEDGER_ADMIN_NAME = env.API_LEDGER_ADMIN_NAME
  env.LEDGER_ADMIN_PASS = env.API_LEDGER_ADMIN_PASS
  env.LEDGER_HOSTNAME = env.LEDGER_HOSTNAME || env.API_HOSTNAME
  env.LEDGER_PORT = env.LEDGER_PORT || Number(env.API_PORT) + 1
  env.LEDGER_PUBLIC_PORT = env.LEDGER_PUBLIC_PORT || clientPublicPort
  env.LEDGER_PUBLIC_PATH = env.LEDGER_PUBLIC_PATH || 'ledger'
  env.LEDGER_CURRENCY_CODE = env.LEDGER_CURRENCY_CODE || 'USD'
  env.LEDGER_CURRENCY_SYMBOL = env.LEDGER_CURRENCY_SYMBOL || '$'
  env.LEDGER_PUBLIC_HTTPS = env.LEDGER_PUBLIC_HTTPS || !!env.API_PUBLIC_HTTPS

  const protocol = env.API_PUBLIC_HTTPS ? 'https:' : 'http:'

  env.API_LEDGER_URI = 'http://' + (env.API_PRIVATE_HOSTNAME || env.LEDGER_HOSTNAME) + ':' + env.LEDGER_PORT
  env.API_LEDGER_PUBLIC_URI = protocol + '//' + env.LEDGER_HOSTNAME + ledgerPublicPort + '/' + env.LEDGER_PUBLIC_PATH
}
