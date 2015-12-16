import {getUser, create} from '../ledger';

export default function register(req) {
  req.session.user = '';

  const user = {
    name: req.body.name,
    password: req.body.password
  };

  return getUser(user, true)
    .then(() => {
      // User already exists
      return Promise.reject({status: 409});
    })
    .catch((err) => {
      if (err.status === 404) {
        // Create the user
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
      return Promise.reject(err);
    })
}
