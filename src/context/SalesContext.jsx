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

const sortSales = (rows) =>
  [...rows].sort((a, b) => {
    const dateSort = (b.date || '').localeCompare(a.date || '')
    if (dateSort !== 0) return dateSort
    return (b.id || '').localeCompare(a.id || '')
  })

const upsertSale = (rows, incoming) => {
  const index = rows.findIndex((sale) => sale.id === incoming.id)
  if (index === -1) return sortSales([incoming, ...rows])

  const next = [...rows]
  next[index] = incoming
  return sortSales(next)
}

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
        setSales(sortSales((data || []).map(mapRowToSale)))
      }

      setIsLoading(false)
    }

    loadSales()
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined

    const channel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SALES_TABLE },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSales((prev) => prev.filter((sale) => sale.id !== payload.old.id))
            return
          }

          if (payload.new) {
            const mapped = mapRowToSale(payload.new)
            setSales((prev) => upsertSale(prev, mapped))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
  }, [sales])

  const productMap = useMemo(
    () => PRODUCTS.reduce((acc, product) => ({ ...acc, [product.id]: product }), {}),
    [],
  )

  const addSale = async (sale) => {
    if (!isSupabaseConfigured || !supabase) {
      const localSale = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      }
      setSales((prev) => upsertSale(prev, localSale))
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
      console.error('Supabase insert failed:', error.message, '| Code:', error.code)
      // Fall back: save locally so the sale is never lost
      const fallbackSale = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      }
      setSales((prev) => upsertSale(prev, fallbackSale))
      return true
    }

    setSales((prev) => upsertSale(prev, mapRowToSale(data)))
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
