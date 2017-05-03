'use strict'

const requestIp = require('request-ip')
const superagent = require('superagent')
const Log = require('./log')
const Config = require('../lib/config')
const ServerError = require('../errors/server-error')

module.exports = class Antifraud {
  constructor (deps) {
    this.config = deps(Config)
    this.log = deps(Log)('antifraud')
  }

  async checkRisk (userObj) {
      // Check for fraud
    const serviceUrl = this.config.data.getIn(['antifraud', 'service_url'])

    if (serviceUrl) {
      const maxRisk = this.config.data.getIn(['antifraud', 'max_risk'])
      let response

      try {
        response = await superagent.post(serviceUrl, {
          email: userObj.email || '',
          username: userObj.username || '',
          name: userObj.name || '',
          phone: userObj.phone || '',
          address1: userObj.address1 || '',
          address2: userObj.address2 || '',
          city: userObj.city || '',
          region: userObj.region || '',
          country: userObj.country || '',
          zip_code: userObj.zip_code || '',
          ip_address: requestIp.getClientIp(this.req),
          augurio_unique_id: userObj.fingerprint
        })
      } catch (err) {
        this.log.error('Antifraud service error: ', err)
      }

      if (response.body && response.body.risklevel) {
        this.log.debug('Signup try: risk level is', response.body.risklevel)

        if (response.body.risklevel > maxRisk) {
          throw new ServerError('Signup denied')
        }
      }
    }
  }
}
