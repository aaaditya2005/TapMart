const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const decimalInrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatCurrency(amount) {
  return inrFormatter.format(Number(amount) || 0)
}

export function formatTaxCurrency(amount) {
  return decimalInrFormatter.format(Number(amount) || 0)
}
