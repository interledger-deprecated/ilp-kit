import {create} from '../ledger';

export default function register(req) {
  req.session.user = '';

  const user = {
    name: req.body.name,
    password: req.body.password
  };
  return create(user)
    .then((user) => {
      // TODO temporary
      user.password = req.body.password;
      req.session.user = user;

      return {
        name: user.name,
        balance: user.balance,
        id: user.id
      };
    });
}
