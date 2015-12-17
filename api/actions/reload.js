import { getUser, create } from '../ledger';

export default function reload(req) {
  return getUser(req.session.user)
    .then((user) => {
      user.password = req.session.password;
      user.balance = "" + (+user.balance + 1000);

      return create(user);
    });
}
