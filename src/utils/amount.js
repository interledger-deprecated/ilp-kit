// Amount formatting
export function amount(num) {
  let am = parseFloat(num)
  am = am > 1 ? am.toFixed(2) : am.toPrecision(2)

  return am.replace(/\.?0+$/, '')
}
