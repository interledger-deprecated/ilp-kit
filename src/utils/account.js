// account formatting
export function getAccountName(account) {
  if (account.indexOf('http://') > -1 || account.indexOf('https://') > -1) {
    const match = account.match(/.*\/([a-z0-9]*)/)
    return match[1]
  }

  return account
}
