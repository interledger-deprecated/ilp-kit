import _ from 'lodash';
import {Payment} from '../models/payment';

export default function history(req) {
  // There's no active session
  if (!req.session.user) {
    return Promise.resolve(null);
  }

  const user = req.session.user.local;

  return Payment.findAll({
    where: {
      $or: [
        {source_user: user.id},
        {destination_user: user.id}
      ]
    }
  })
  .then((data) => {
    return _.map(data, (payment) => {
      return payment.getDataExternal()
    });
  });
}
