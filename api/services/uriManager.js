const UriManager = require('five-bells-shared/lib/uri-manager').UriManager
const config = require('./config')

const uri = module.exports = new UriManager(config.server.base_uri)
