export function contextualizePayment(payment, user) {
  if (payment.source_user === user.id || payment.source_account === user.account) {
    payment.counterpartyAccount = payment.destination_account;
  } else if (payment.destination_user === user.id || payment.destination_account === user.account) {
    payment.counterpartyAccount = payment.source_account;
  }

  return payment;
}
