export default function loadAuth(req) {
  return Promise.resolve(req.session.user && {
    name: req.session.user.name,
    balance: req.session.user.balance,
    id: req.session.user.id
  } || null);
}
