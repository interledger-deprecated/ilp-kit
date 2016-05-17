"use strict"

const path = require('path')
const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport');
const Log = require('../lib/log')
const Config = require('../lib/config')

const EmailTemplate = require('email-templates').EmailTemplate

const templatesDir = path.resolve(__dirname, '..', 'email')

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

  * sendWelcome (params) {
    let locals = {
      name: params.name,
      link: params.link
    }

    return yield this.send({
      template: 'welcome',
      locals: locals,
      to: params.to
    })
  }

  * changeEmail (params) {
    let locals = {
      name: params.name,
      link: params.link
    }

    return yield this.send({
      template: 'change-email',
      locals: locals,
      to: params.to
    })
  }

  * send (params) {
    const self = this

    const template = new EmailTemplate(path.join(templatesDir, params.template))

    try {
      yield new Promise(function(reject, resolve){
        // TODO figure out the responses
        // TODO sometimes may go to spam folder. investigate and read this
        // https://documentation.mailgun.com/best_practices.html#email-best-practices
        template.render(params.locals, function (err, results) {
          if (err) {
            return reject(err)
          }

          self.transporter.sendMail({
            // TODO differentiate red and blue
            from: '"Five Bells Team " <wallet@ilpdemo.org>',
            to: params.to,
            subject: results.subject,
            html: results.html,
            text: results.text
          }, function (err, responseStatus) {
            if (err) {
              return reject(err)
            }
            self.log.info('Email sent', responseStatus)

            resolve(responseStatus)
          })
        })
      })
    } catch(err) {
      self.log.critical(err)
    }
  }
}