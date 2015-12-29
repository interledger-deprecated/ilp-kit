import * as ledger from '../ledger';
import {User} from '../models/user'

export default function login(req) {
  req.session.user = '';

  const user = {
    name: req.body.name,
    password: req.body.password
  };
  return ledger.getUser(user)
    .then((user) => {
      // TODO temporary
      user.password = req.body.password;
      req.session.user = user;

      return User.findOne({where:{name: user.name}})
        .then((localUser) => {
          req.session.user.local = localUser;

          return {
            name: user.name,
            balance: user.balance,
            id: user.id
          };
        });
    });
}
