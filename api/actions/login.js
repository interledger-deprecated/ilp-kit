import getUser from '../ledger';

export default function login(req) {
  req.session.user = '';

  const user = {
    name: req.body.name,
    password: req.body.password
  };
  return getUser(user)
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
