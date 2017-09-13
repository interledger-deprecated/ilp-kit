// account formatting
export function getAccountName (account) {
  if (!account) return

  const match = account.match(/(.*)@.*/)

  if (match) return match[1]
}
