export function contextualizePayment (payment, user) {
  if (payment.source_identifier === user.identifier) {
    payment.counterpartyIdentifier = payment.destination_identifier
    payment.counterpartyName = payment.destination_name
  } else if (payment.destination_identifier === user.identifier) {
    payment.counterpartyIdentifier = payment.source_identifier
    payment.counterpartyName = payment.source_name
  }

  return payment
}
