import create from '../ledger';

export default function register(req) {
  const user = {
    name: req.body.name,
    password: req.body.password
  };
  return create(user)
    .then((user) => {
      req.session.user = user;
      return user;
    })
    .catch((err) => {
      console.log('err', err);
      req.session.user = '';
    });
}
