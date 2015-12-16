import getUser from '../ledger';

export default function login(req) {
  req.session.user = '';

  const user = {
    name: req.body.name,
    password: req.body.password
  };
  return getUser(user)
    .then((user) => {
      req.session.user = user;
      return user;
    });
}
