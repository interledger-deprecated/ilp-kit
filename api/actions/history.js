import _ from 'lodash';
import {Payment} from '../models/payment';

export default function history(req) {
  // There's no active session
  if (!req.session.user) {
    return Promise.resolve(null);
  }

  return Payment.findAll()
    .then((data) => {
      return _.map(data, (payment) => {
        return payment.getDataExternal()
      });
    });
}
