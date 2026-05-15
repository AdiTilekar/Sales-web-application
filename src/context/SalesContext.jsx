import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SHOP_ID, PRODUCTS, SHOPS, getProductsForShop } from '../data/products'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getLocalISODate, toLocalDateKey } from '../utils/date'

const STORAGE_KEY = 'kulfi-sales-records-v2'
const SHOP_STORAGE_KEY = 'kulfi-sales-current-shop-v1'
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

const filterSalesForShop = (rows, shopId) => rows.filter((sale) => (sale.shopId || DEFAULT_SHOP_ID) === shopId)

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
  shopId: row.shop_id || row.shopId || DEFAULT_SHOP_ID,
})

const baseProductById = PRODUCTS.reduce((acc, product) => ({ ...acc, [product.id]: product }), {})

const normalizeLoadedSale = (sale) => ({
  ...sale,
  shopId: sale.shopId || DEFAULT_SHOP_ID,
})

const normalizeSaleForStorage = (sale, fallbackShopId = DEFAULT_SHOP_ID) => {
  const shopId = sale.shopId || fallbackShopId || DEFAULT_SHOP_ID
  const product = getProductsForShop(shopId).find((item) => item.id === sale.productId)
  const baseProduct = baseProductById[sale.productId]
  const normalizedDate = toLocalDateKey(sale.date) || getLocalISODate()
  const unitPrice = Number(sale.unitPrice ?? product?.price ?? baseProduct?.price ?? 0)
  const unitProfit = Number(sale.unitProfit ?? baseProduct?.profitPerUnit ?? 0)
  const unitCost = Number(sale.unitCost ?? Math.max(0, unitPrice - unitProfit))

  return {
    ...sale,
    shopId,
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

const isLocalOnlySale = (sale) => String(sale.id || '').startsWith('local-')

const isMissingUnitCostError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  return message.includes('unit_cost') && (message.includes('schema cache') || code === 'pgrst204')
}

const toInsertPayload = (sales, includeUnitCost = true) =>
  sales.map((sale) => {
    const payload = {
      date: sale.date,
      product_id: sale.productId,
      quantity: sale.quantity,
      unit_price: sale.unitPrice,
      unit_profit: sale.unitProfit,
      customer: sale.customer,
      city: sale.city,
      shop_id: sale.shopId || DEFAULT_SHOP_ID,
    }

    if (includeUnitCost) {
      payload.unit_cost = sale.unitCost
    }

    return payload
  })

const insertSalesToCloud = async (normalizedBatch) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured') }
  }

  let response = await supabase.from(SALES_TABLE).insert(toInsertPayload(normalizedBatch, true)).select('*')

  if (response.error && isMissingUnitCostError(response.error)) {
    // Backward compatibility for projects where unit_cost is not yet migrated.
    response = await supabase.from(SALES_TABLE).insert(toInsertPayload(normalizedBatch, false)).select('*')
  }

  return response
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
    return sortSales(JSON.parse(saved).map(normalizeLoadedSale))
  } catch {
    return []
  }
}

export const SalesProvider = ({ children }) => {
  const [allSales, setAllSales] = useState([])
  const [currentShopId, setCurrentShopId] = useState(() => {
    try {
      return localStorage.getItem(SHOP_STORAGE_KEY) || DEFAULT_SHOP_ID
    } catch {
      return DEFAULT_SHOP_ID
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'checking' : 'local')
  const [lastSyncError, setLastSyncError] = useState('')
  const isSyncingPendingRef = useRef(false)

  const currentShop = useMemo(
    () => SHOPS.find((shop) => shop.id === currentShopId) || SHOPS[0],
    [currentShopId],
  )

  const syncPendingLocalSales = async (pendingSales) => {
    if (!isSupabaseConfigured || !supabase || pendingSales.length === 0) return false

    const normalizedBatch = pendingSales.map((sale) => normalizeSaleForStorage(sale, sale.shopId || DEFAULT_SHOP_ID))
    const pendingIds = new Set(normalizedBatch.map((sale) => sale.id))

    const { data, error } = await insertSalesToCloud(normalizedBatch)

    if (error) {
      setSyncStatus('degraded')
      setLastSyncError(error.message || 'Cloud sync failed')
      return false
    }

    const insertedSales = (data || []).map(mapRowToSale)
    setAllSales((prev) => {
      const withoutPending = prev.filter((sale) => !pendingIds.has(sale.id))
      return upsertManySales(withoutPending, insertedSales)
    })
    setSyncStatus('cloud')
    setLastSyncError('')
    return true
  }

  useEffect(() => {
    const loadSales = async () => {
      const localSales = readLocalSales()

      if (!isSupabaseConfigured || !supabase) {
        setAllSales(localSales)
        setSyncStatus('local')
        setLastSyncError('')
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
        setAllSales(localSales)
        setSyncStatus('degraded')
        setLastSyncError(error.message || 'Unable to load cloud sales')
      } else {
        const remoteSales = sortSales((data || []).map(mapRowToSale))
        // Keep locally cached fallback sales visible after refresh when cloud insert failed.
        const mergedSales = upsertManySales(remoteSales, localSales)
        setAllSales(mergedSales)

        const pendingLocalSales = mergedSales.filter(isLocalOnlySale)
        if (pendingLocalSales.length > 0) {
          const synced = await syncPendingLocalSales(pendingLocalSales)
          if (!synced) {
            setSyncStatus('degraded')
          }
        } else {
          setSyncStatus('cloud')
          setLastSyncError('')
        }
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
    if (!isSupabaseConfigured || !supabase || isLoading) return undefined

    const pendingLocalSales = allSales.filter(isLocalOnlySale)
    if (pendingLocalSales.length === 0) return undefined

    const retryTimer = setTimeout(async () => {
      if (isSyncingPendingRef.current) return
      isSyncingPendingRef.current = true
      await syncPendingLocalSales(pendingLocalSales)
      isSyncingPendingRef.current = false
    }, 1500)

    return () => clearTimeout(retryTimer)
  }, [allSales, isLoading])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSales))
  }, [allSales])

  useEffect(() => {
    localStorage.setItem(SHOP_STORAGE_KEY, currentShopId)
  }, [currentShopId])

  const productMap = useMemo(
    () => getProductsForShop(currentShopId).reduce((acc, product) => ({ ...acc, [product.id]: product }), {}),
    [currentShopId],
  )

  const products = useMemo(() => getProductsForShop(currentShopId), [currentShopId])

  const todaySales = useMemo(
    () => filterSalesForToday(filterSalesForShop(allSales, currentShopId)),
    [allSales, currentShopId],
  )
  const historySales = useMemo(
    () => filterSalesForHistory(filterSalesForShop(allSales, currentShopId)),
    [allSales, currentShopId],
  )

  const addSalesBatch = async (salesBatch) => {
    if (!Array.isArray(salesBatch) || salesBatch.length === 0) return true
    const salesForCurrentShop = salesBatch.map((sale) => ({
      ...sale,
      shopId: sale.shopId || currentShopId,
    }))
    const normalizedBatch = salesForCurrentShop.map((sale) => normalizeSaleForStorage(sale, currentShopId))

    if (!isSupabaseConfigured || !supabase) {
      const localSales = normalizedBatch.map((sale) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      }))
      setAllSales((prev) => upsertManySales(prev, localSales))
      setSyncStatus('local')
      setLastSyncError('')
      return true
    }

    const { data, error } = await insertSalesToCloud(normalizedBatch)

    if (error) {
      console.error('Supabase insert failed:', error.message, '| Code:', error.code)
      // Fall back: save locally so the sales are never lost
      const fallbackSales = normalizedBatch.map((sale) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...sale,
      }))
      setAllSales((prev) => upsertManySales(prev, fallbackSales))
      setSyncStatus('degraded')
      setLastSyncError(error.message || 'Insert failed in cloud mode')
      return true
    }

    const insertedSales = (data || []).map(mapRowToSale)
    setAllSales((prev) => upsertManySales(prev, insertedSales))
    setSyncStatus('cloud')
    setLastSyncError('')
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
    currentShopId,
    setCurrentShopId,
    currentShop,
    addSale,
    addSalesBatch,
    deleteSale,
    clearSales,
    isLoading,
    isCloudSyncEnabled: syncStatus === 'cloud',
    hasCloudConfig: isSupabaseConfigured,
    syncStatus,
    lastSyncError,
    products,
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
