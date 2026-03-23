import { PRODUCTS } from '../data/products'
import { getLocalISODate } from './date'

const CUSTOMERS = [
  'Ganesh Sweets',
  'Kulfi Corner',
  'Royal Dairy',
  'Aditi Retail',
  'City Chaat',
  'Shiv Snacks',
  'Mahalaxmi Stores',
  'Krishna Mart',
  'Fresh Bites',
  'Sweet Hub',
]

const CITIES = [
  'Pune',
  'Mumbai',
  'Nashik',
  'Kolhapur',
  'Nagpur',
  'Aurangabad',
  'Satara',
  'Sangli',
]

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const generateSeedSales = (days = 60) => {
  const sales = []
  const now = new Date()

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset -= 1) {
    const currentDate = new Date(now)
    currentDate.setDate(now.getDate() - dayOffset)
    const dateStr = getLocalISODate(currentDate)
    const ordersCount = randomBetween(4, 10)

    for (let i = 0; i < ordersCount; i += 1) {
      const product = pick(PRODUCTS)
      const quantity = randomBetween(5, 35)

      sales.push({
        id: `${dateStr}-${product.id}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        date: dateStr,
        productId: product.id,
        quantity,
        customer: pick(CUSTOMERS),
        city: pick(CITIES),
      })
    }
  }

  return sales
}
