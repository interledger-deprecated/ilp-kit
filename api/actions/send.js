import { transfer } from '../ledger';
import { Payment } from '../models/payment'

export default function send(req) {
  const options = {
    recipient: req.body.recipient,
    amount: req.body.amount,
    username: req.session.user.name,
    password: req.session.user.password
  }
  return transfer(options)
    .then((transfer) => {
      return Payment.create({
        source_user: req.session.user.local.id,
        // TODO add destination_user if exists
        destination_account: req.body.recipient,
        source_amount: req.body.amount,
        // TODO could be multiple transfers
        transfers: [transfer.id],
        // TODO state
        // TODO completed_at
        destination_amount: req.body.amount
      })
    })
}
