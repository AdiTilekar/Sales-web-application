import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products'

const STORAGE_KEY = 'kulfi-sales-records-v2'
const LEGACY_STORAGE_KEYS = ['kulfi-sales-records-v1']

const SalesContext = createContext(null)

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState(() => {
    const hasLegacySales = LEGACY_STORAGE_KEYS.some((key) => localStorage.getItem(key))

    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))

    if (hasLegacySales) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
  }, [sales])

  const productMap = useMemo(
    () => PRODUCTS.reduce((acc, product) => ({ ...acc, [product.id]: product }), {}),
    [],
  )

  const addSale = (sale) => {
    setSales((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      },
      ...prev,
    ])
  }

  const deleteSale = (id) => {
    setSales((prev) => prev.filter((sale) => sale.id !== id))
  }

  const clearSales = () => {
    setSales([])
  }

  const value = {
    sales,
    addSale,
    deleteSale,
    clearSales,
    products: PRODUCTS,
    productMap,
  }

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
}

export const useSales = () => {
  const context = useContext(SalesContext)
  if (!context) {
    throw new Error('useSales must be used within SalesProvider')
  }
  return context
}
