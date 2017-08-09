// Amount formatting
export function amount (num, currency) {
  let am = parseFloat(num)

  am = (am > 1 || am < -1) ? am.toFixed(2) : am.toPrecision(2)

  am = am.replace(/\.0$/, '.00')

  if (currency) {
    am = currency + am
    am = am.replace(currency + '-', '-' + currency)
  }

  const integer = am.replace(/\.[0-9]+$/, '')
  const fractional = am.replace(/.*\./, '')

  return {integer, fractional}
}
