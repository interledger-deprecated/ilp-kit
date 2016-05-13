"use strict"

const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport');
const Log = require('../lib/log')

module.exports = class Mailer {
  static constitute () { return [ Log, Config ] }
  constructor (log, config) {
    this.log = log('mailer')

    var auth = {
      auth: {
        // TODO needs to be an environment variable
        api_key: config.data.getIn(['mailgun', 'api_key']),
        domain: config.data.getIn(['mailgun', 'domain'])
      }
    }

    // create reusable transporter object using the default SMTP transport
    this.transporter = nodemailer.createTransport(mg(auth));
  }

  * send (params) {
    const self = this

    let from = params.fromEmail

    if (params.fromName) {
      from = '"' + params.fromName + ' " <' + params.fromEmail + '>'
    }

    // setup e-mail data with unicode symbols
    var mailOptions = {
      from: from,
      to: params.to,
      subject: params.subject,
      text: params.message
      // html: 'HTML'
    }

    // send mail with defined transport object
    try {
      yield new Promise(function(reject, resolve){
        // TODO figure out the responses
        // TODO sometimes may go to spam folder. investigate and read this
        // https://documentation.mailgun.com/best_practices.html#email-best-practices
        self.transporter.sendMail(mailOptions, function(err, info){
          // if (err) {
          //   return reject(err)
          // }
          self.log.info('Email sent', err, info)

          resolve(info)
        })
      })
    } catch(err) {
      self.log.critical(err)
    }
  }
}