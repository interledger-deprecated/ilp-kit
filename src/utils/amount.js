// Amount formatting
export function amount(num, currency) {
  let am = parseFloat(num)

  am = (am > 1 || am < -1) ? am.toFixed(2) : am.toPrecision(2)

  am = am.replace(/\.?0+$/, '')

  if (currency) {
    am = '$' + am
    am = am.replace('$-', '-$')
  }

  return am
}
