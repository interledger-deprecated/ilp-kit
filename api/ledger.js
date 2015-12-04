import superagent from 'superagent'
import config from '../src/config';

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