require('babel-polyfill')
require('../bin/env').normalizeEnv(true)

// Webpack config for creating the production bundle.
var path = require('path');
var execSync = require('child_process').execSync;
var webpack = require('webpack');
var CleanPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var SentryPlugin = require('webpack-sentry-plugin');
var strip = require('strip-loader');

var projectRootPath = path.resolve(__dirname, '../');
var assetsPath = path.resolve(projectRootPath, './static/dist');

// https://github.com/halt-hammerzeit/webpack-isomorphic-tools
var WebpackIsomorphicToolsPlugin = require('webpack-isomorphic-tools/plugin');
var webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(require('./webpack-isomorphic-tools'));

const plugins = [
  new CleanPlugin([assetsPath], { root: projectRootPath }),

  // css files from the extract-text-plugin loader
  new ExtractTextPlugin('[name]-[chunkhash].css', {allChunks: true}),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: '"production"'
    },

    __CLIENT__: true,
    __SERVER__: false,
    __DEVELOPMENT__: false,
    __DEVTOOLS__: false
  }),

  // ignore dev config
  new webpack.IgnorePlugin(/\.\/dev/, /\/config$/),

  // optimizations
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }),
  // TODO:PERFORMANCE this is not a final solution to long term caching.
  //   If the number of modules changes (add/remove modules), all of the chunknames change too
  new webpack.optimize.CommonsChunkPlugin("vendor", "vendor-[chunkhash].js"),
  new webpack.optimize.CommonsChunkPlugin({name: 'meta', chunks: ["vendor"]}),

  webpackIsomorphicToolsPlugin
]

if (process.env.API_SENTRY_DSN) {
  plugins.push(new SentryPlugin({
    organisation: process.env.API_SENTRY_ORG,
    project: process.env.API_SENTRY_PROJECT,
    apiKey: process.env.API_SENTRY_API_KEY,
    filenameTransform: function(filename) {
      return '~/dist/' + filename
    },
    release: function() {
      return execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().split('\n').join('')
    }
  }))
}

module.exports = {
  context: path.resolve(__dirname, '..'),
  entry: {
    'main': [
      'bootstrap-sass!./src/theme/bootstrap.config.prod.js',
      'font-awesome-webpack!./src/theme/font-awesome.config.prod.js',
      './src/client.js'
    ],
    'vendor': [
      'react',
      'react-dom',
      'react-dom/server',
      'react-router',
      'redux',
      'react-redux',
      'redux-connect',
      'redux-form',
      'socket.io-client',
      'react-ga',
      'serialize-javascript',
      'uuid4',
      'react-transition-group',
      'react-timeago',
      'moment',
      'moment-timezone',
      'classnames/bind',
      'react-router-redux',
      'redux-pagination',
      'react-dropzone-component',
      'superagent',
      'uuid4',
      'react-hotkeys',
      'react-fittext',

      'react-bootstrap/lib/Alert',
      'react-bootstrap/lib/Navbar',
      'react-bootstrap/lib/Nav',
      'react-bootstrap/lib/NavItem',
      'react-bootstrap/lib/NavDropdown',
      'react-bootstrap/lib/MenuItem'
    ]
  },
  devtool: 'source-map',
  output: {
    path: assetsPath,
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: '/dist/'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules\/(?!ilp-kit).*/, loaders: [strip.loader('debug'), 'babel']},
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.less$/, loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=2&sourceMap!postcss?sourceMap!less?outputStyle=expanded&sourceMap=true&sourceMapContents=true') },
      { test: /\.scss$/, loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=2&sourceMap!postcss?sourceMap!resolve-url!sass?outputStyle=expanded&sourceMap=true&sourceMapContents=true') },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
      { test: webpackIsomorphicToolsPlugin.regular_expression('images'), loader: 'url-loader?limit=10240' }
    ]
  },
  progress: true,
  resolve: {
    modulesDirectories: [
      'src',
      'node_modules'
    ],
    extensions: ['', '.json', '.js']
  },
  sassLoader: {
    includePaths: [path.resolve(__dirname, "../src/theme"), 'node_modules']
  },
  plugins
};
