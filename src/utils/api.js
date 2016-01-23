export function contextualizePayment(payment, user) {
  if (payment.source_user === user.id) {
    payment.counterpartyAccount = payment.destination_account;
  } else if (payment.destination_account === user.username) {
    payment.counterpartyAccount = payment.sourceUserUsername;
  }

  return payment;
}
