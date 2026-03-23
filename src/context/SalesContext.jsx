import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getLocalISODate, toLocalDateKey } from '../utils/date'

const STORAGE_KEY = 'kulfi-sales-records-v2'
const LEGACY_STORAGE_KEYS = ['kulfi-sales-records-v1']
const SALES_TABLE = 'sales'

const SalesContext = createContext(null)

const getTodayDate = () => getLocalISODate()

const filterSalesForToday = (rows) => {
  const today = getTodayDate()
  return rows.filter((sale) => toLocalDateKey(sale.date) === today)
}

const filterSalesForHistory = (rows) => {
  const today = getTodayDate()
  return rows.filter((sale) => toLocalDateKey(sale.date) !== today)
}

const mapRowToSale = (row) => ({
  id: row.id,
  date: row.date,
  productId: row.product_id,
  quantity: row.quantity,
  unitPrice: row.unit_price ?? null,
  unitProfit: row.unit_profit ?? null,
  unitCost: row.unit_cost ?? null,
  customer: row.customer || 'Walk-in Customer',
  city: row.city || 'Pune',
})

const productById = PRODUCTS.reduce((acc, product) => ({ ...acc, [product.id]: product }), {})

const normalizeSaleForStorage = (sale) => {
  const product = productById[sale.productId]
  const normalizedDate = toLocalDateKey(sale.date) || getLocalISODate()
  const unitPrice = Number(sale.unitPrice ?? product?.price ?? 0)
  const unitProfit = Number(sale.unitProfit ?? product?.profitPerUnit ?? 0)
  const unitCost = Number(sale.unitCost ?? Math.max(0, unitPrice - unitProfit))

  return {
    ...sale,
    date: normalizedDate,
    unitPrice,
    unitProfit,
    unitCost,
  }
}

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

const upsertManySales = (rows, incomingRows) =>
  incomingRows.reduce((acc, sale) => upsertSale(acc, sale), rows)

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
    return sortSales(JSON.parse(saved))
  } catch {
    return []
  }
}

export const SalesProvider = ({ children }) => {
  const [allSales, setAllSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSales = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setAllSales(readLocalSales())
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
        setAllSales(readLocalSales())
      } else {
        setAllSales(sortSales((data || []).map(mapRowToSale)))
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
            setAllSales((prev) => prev.filter((sale) => sale.id !== payload.old.id))
            return
          }

          if (payload.new) {
            const mapped = mapRowToSale(payload.new)
            setAllSales((prev) => upsertSale(prev, mapped))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSales))
  }, [allSales])

  const productMap = useMemo(
    () => PRODUCTS.reduce((acc, product) => ({ ...acc, [product.id]: product }), {}),
    [],
  )

  const todaySales = useMemo(() => filterSalesForToday(allSales), [allSales])
  const historySales = useMemo(() => filterSalesForHistory(allSales), [allSales])

  const addSalesBatch = async (salesBatch) => {
    if (!Array.isArray(salesBatch) || salesBatch.length === 0) return true
    const normalizedBatch = salesBatch.map(normalizeSaleForStorage)

    if (!isSupabaseConfigured || !supabase) {
      const localSales = normalizedBatch.map((sale) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      }))
      setAllSales((prev) => upsertManySales(prev, localSales))
      return true
    }

    const { data, error } = await supabase
      .from(SALES_TABLE)
      .insert(
        normalizedBatch.map((sale) => ({
          date: sale.date,
          product_id: sale.productId,
          quantity: sale.quantity,
          unit_price: sale.unitPrice,
          unit_profit: sale.unitProfit,
          unit_cost: sale.unitCost,
          customer: sale.customer,
          city: sale.city,
        })),
      )
      .select('*')

    if (error) {
      console.error('Supabase insert failed:', error.message, '| Code:', error.code)
      // Fall back: save locally so the sales are never lost
      const fallbackSales = normalizedBatch.map((sale) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      }))
      setAllSales((prev) => upsertManySales(prev, fallbackSales))
      return true
    }

    const insertedSales = (data || []).map(mapRowToSale)
    setAllSales((prev) => upsertManySales(prev, insertedSales))
    return true
  }

  const addSale = async (sale) => addSalesBatch([sale])

  const deleteSale = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setAllSales((prev) => prev.filter((sale) => sale.id !== id))
      return true
    }

    const { error } = await supabase.from(SALES_TABLE).delete().eq('id', id)

    if (error) {
      console.error('Failed to delete sale from Supabase:', error.message)
      return false
    }

    setAllSales((prev) => prev.filter((sale) => sale.id !== id))
    return true
  }

  const clearSales = () => {
    setAllSales([])
  }

  const value = {
    sales: todaySales,
    todaySales,
    historySales,
    allSales,
    addSale,
    addSalesBatch,
    deleteSale,
    clearSales,
    isLoading,
    isCloudSyncEnabled: isSupabaseConfigured,
    products: PRODUCTS,
    productMap,
    todayDate: getTodayDate(),
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
