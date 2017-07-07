var Express = require('express');
var webpack = require('webpack');
var fs = require('fs')

require('../bin/env').normalizeEnv()

var config = require('../src/config');
var webpackConfig = require('./dev.config');
var compiler = webpack(webpackConfig);

var host = config.host || 'localhost';
var port = parseInt(config.port) + 1;
var serverOptions = {
  contentBase: process.env.DEV_PROTOCOL + '://' + host + ':' + port,
  quiet: true,
  noInfo: true,
  hot: true,
  inline: true,
  lazy: false,
  publicPath: webpackConfig.output.publicPath,
  headers: {'Access-Control-Allow-Origin': '*'},
  stats: {colors: true}
};

var app = new Express();

app.use(require('webpack-dev-middleware')(compiler, serverOptions));
app.use(require('webpack-hot-middleware')(compiler));

const lib = require(process.env.DEV_PROTOCOL)

const callback = function onAppListening(err) {
  if (err) {
    console.error(err);
  } else {
    console.info('==> Webpack development server listening on port %s', port);
  }
}

if (process.env.DEV_PROTOCOL === 'https') {
  lib.createServer({
    key: fs.readFileSync(process.env.CERT_FILE),
    cert: fs.readFileSync(process.env.CERT_FILE)
  }, app).listen(port, callback)
} else {
  lib.createServer(app).listen(port, callback)
}
