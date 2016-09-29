export function contextualizePayment(payment, user) {
  if (payment.source_account === user.account) {
    payment.counterpartyAccount = payment.destination_account
    payment.counterpartyName = payment.destination_name
  } else if (payment.destination_account === user.account) {
    payment.counterpartyAccount = payment.source_account
    payment.counterpartyName = payment.source_name
  }

  return payment
}
