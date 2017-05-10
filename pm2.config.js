module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'ledger',
      script    : './bin/ledger.js',
      env: {
        COMMON_VARIABLE: 'true',
        NODE_ENV: 'production',
        DEBUG: 'ilp*,connector*'
      }
    },
    {
      name      : 'api',
      script    : './bin/api.js',
      env: {
        COMMON_VARIABLE: 'true',
        NODE_PATH: './api',
        NODE_ENV: 'production',
        DEBUG: 'ilp*,connector*'
      }
    },
    {
      name      : 'web',
      script    : './bin/server.js',
      env: {
        COMMON_VARIABLE: 'true',
        NODE_PATH: './src',
        NODE_ENV: 'production',
        DEBUG: 'ilp*,connector*'
      }
    }
  ]
};
