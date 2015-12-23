export default function history(req) {
  // There's no active session
  if (!req.session.user) {
    return Promise.resolve(null);
  }

  return Promise.resolve([{amount:'10'},{amount:'20'}]);
}
