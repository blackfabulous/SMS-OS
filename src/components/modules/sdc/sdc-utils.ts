export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}
