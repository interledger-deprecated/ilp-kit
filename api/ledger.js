import superagent from 'superagent'
import config from '../src/config';
import uuid from 'uuid4';

export default function getUser(user) {
  return new Promise((resolve, reject) => {
    superagent
      .get(config.ledgerHost + ':' + config.ledgerPort + '/accounts/' + user.name)
      .end((err, { body } = {}) => err ? reject(body || err) : resolve(body))
  })
}

export function create(user) {
  return new Promise((resolve, reject) => {
    superagent
      .put(config.ledgerHost + ':' + config.ledgerPort + '/accounts/' + user.name)
      .send({
        name: user.name,
        password: user.password,
        balance: '1000'
      })
      .auth(config.ledgerAdminName, config.ledgerAdminPass)
      .end((err, { body } = {}) => err ? reject(body || err) : resolve(body))
  })
}

export function transfer(options) {
  let ledgerUrl = 'http://' + config.ledgerHost + ':' + config.ledgerPort;
  let paymentId = uuid();

  return new Promise((resolve, reject) => {
    superagent
      .put(ledgerUrl + '/transfers/' + paymentId)
      .send({
        debits: [{
          account: ledgerUrl + '/accounts/' + options.username,
          amount: options.amount,
          authorized: true
        }],
        credits: [{
          account: ledgerUrl + '/accounts/' + options.recipient,
          amount: options.amount
        }],
        expires_at: "2016-06-16T00:00:01.000Z"
      })
      .auth(options.username, options.password)
      .end((err, { body } = {}) => err ? reject(body || err) : resolve(body))
  })
}
