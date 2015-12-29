import * as ledger from '../ledger';
import {User} from '../models/user'

export default function register(req) {
  req.session.user = '';

  const user = {
    name: req.body.name,
    password: req.body.password
  };

  return ledger.getUser(user, true)
    .then(() => {
      // User already exists
      return Promise.reject({status: 409});
    })
    .catch((err) => {
      if (err.status === 404) {
        // TODO maybe move this logic somewhere else
        // Create the user
        return ledger.create(user)
          .then((user) => {
            // TODO temporary
            user.password = req.body.password;

            // TODO catch exceptions
            return User.create({
              name: user.name
            }).then(() => {
              req.session.user = user;

              return {
                name: user.name,
                balance: user.balance,
                id: user.id
              };
            });
          });
      }
      return Promise.reject(err);
    })
}
