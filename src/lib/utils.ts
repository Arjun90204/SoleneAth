// Currency formatting for Indian Rupees
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Convert USD to INR (approximate rate: 1 USD = 83 INR)
export const USD_TO_INR = 83

// Free shipping threshold in INR
export const FREE_SHIPPING_THRESHOLD = 2999
