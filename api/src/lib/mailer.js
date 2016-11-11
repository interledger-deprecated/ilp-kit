"use strict"

const path = require('path')
const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport');
const Log = require('../lib/log')
const Config = require('../lib/config')

const EmailTemplate = require('email-templates').EmailTemplate

const templatesDir = path.resolve(__dirname, '..', 'email')

module.exports = class Mailer {
  static constitute() { return [ Log, Config ] }
  constructor(log, config) {
    this.log = log('mailer')
    this.config = config

    const auth = {
      auth: {
        api_key: config.data.getIn(['mailgun', 'api_key']),
        domain: config.data.getIn(['mailgun', 'domain'])
      }
    }

    // create reusable transporter object using the default SMTP transport
    this.transporter = nodemailer.createTransport(mg(auth));
  }

  sendWelcome(params) {
    const locals = {
      name: params.name,
      link: params.link
    }

    return this.send({
      template: 'welcome',
      locals: locals,
      to: params.to
    })
  }

  changeEmail(params) {
    const locals = {
      name: params.name,
      link: params.link
    }

    return this.send({
      template: 'change-email',
      locals: locals,
      to: params.to
    })
  }

  forgotPassword(params) {
    const locals = {
      name: params.name,
      link: params.link
    }

    return this.send({
      template: 'forgot-password',
      locals: locals,
      to: params.to
    })
  }

  * send(params) {
    const self = this

    const senderName = this.config.data.getIn(['email', 'sender_name'])
    const senderAddress = this.config.data.getIn(['email', 'sender_address'])
    const template = new EmailTemplate(path.join(templatesDir, params.template))

    try {
      yield new Promise((reject, resolve) => {
        // TODO figure out the responses
        // TODO sometimes may go to spam folder. investigate and read this
        // https://documentation.mailgun.com/best_practices.html#email-best-practices
        template.render(params.locals, (err, results) => {
          if (err) {
            return reject(err)
          }

          self.transporter.sendMail({
            from: '"' + senderName + ' " <' + senderAddress +'>',
            to: params.to,
            subject: results.subject,
            html: results.html,
            text: results.text
          }, (error, responseStatus) => {
            if (error) return reject(error)

            self.log.info('Email sent', responseStatus)

            resolve(responseStatus)
          })
        })
      })
    } catch (error) {
      self.log.critical(error)
    }
  }
}
