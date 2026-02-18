export function formatCurrency(amount: number | string, currency: string = 'XAF'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) return '0 FCFA'

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount)

  switch (currency) {
    case 'XAF':
      return `${formatted} FCFA`
    case 'EUR':
      return `${formatted} €`
    case 'USD':
      return `${formatted} $`
    default:
      return `${formatted} FCFA`
  }
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}
