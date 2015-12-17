import {getUser} from '../ledger';

export default function loadAuth(req) {
  // There's no active session
  if (!req.session.user) {
    return Promise.resolve(null);
  }

  // Get some fresh data
  return getUser({
    name: req.session.user.name,
    password: req.session.user.password
  })
}
