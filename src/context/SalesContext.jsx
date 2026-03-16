import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'kulfi-sales-records-v2'
const LEGACY_STORAGE_KEYS = ['kulfi-sales-records-v1']
const SALES_TABLE = 'sales'

const SalesContext = createContext(null)

const mapRowToSale = (row) => ({
  id: row.id,
  date: row.date,
  productId: row.product_id,
  quantity: row.quantity,
  customer: row.customer || 'Walk-in Customer',
  city: row.city || 'Pune',
})

const readLocalSales = () => {
  const hasLegacySales = LEGACY_STORAGE_KEYS.some((key) => localStorage.getItem(key))

  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))

  if (hasLegacySales) {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSales = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setSales(readLocalSales())
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from(SALES_TABLE)
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load sales from Supabase:', error.message)
        setSales(readLocalSales())
      } else {
        setSales((data || []).map(mapRowToSale))
      }

      setIsLoading(false)
    }

    loadSales()
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
  }, [sales])

  const productMap = useMemo(
    () => PRODUCTS.reduce((acc, product) => ({ ...acc, [product.id]: product }), {}),
    [],
  )

  const addSale = async (sale) => {
    if (!isSupabaseConfigured || !supabase) {
      setSales((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ...sale,
        },
        ...prev,
      ])
      return true
    }

    const { data, error } = await supabase
      .from(SALES_TABLE)
      .insert({
        date: sale.date,
        product_id: sale.productId,
        quantity: sale.quantity,
        customer: sale.customer,
        city: sale.city,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Failed to save sale to Supabase:', error.message)
      return false
    }

    setSales((prev) => [mapRowToSale(data), ...prev])
    return true
  }

  const deleteSale = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setSales((prev) => prev.filter((sale) => sale.id !== id))
      return true
    }

    const { error } = await supabase.from(SALES_TABLE).delete().eq('id', id)

    if (error) {
      console.error('Failed to delete sale from Supabase:', error.message)
      return false
    }

    setSales((prev) => prev.filter((sale) => sale.id !== id))
    return true
  }

  const clearSales = () => {
    setSales([])
  }

  const value = {
    sales,
    addSale,
    deleteSale,
    clearSales,
    isLoading,
    isCloudSyncEnabled: isSupabaseConfigured,
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
