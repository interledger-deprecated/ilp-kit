import {Payment} from '../models/payment'

export default function history(req) {
  // There's no active session
  if (!req.session.user) {
    return Promise.resolve(null);
  }

  return Payment.findAll();
}
