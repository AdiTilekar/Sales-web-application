import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import MetricCard from '../components/MetricCard'
import { useSales } from '../context/SalesContext'
import { getLocalISODate, toLocalDateKey } from '../utils/date'
import { aggregateFinance, getProfitMarginPercent, getSaleFinance } from '../utils/finance'

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`
const RANGE_OPTIONS = ['today', 'yesterday', 'week', 'month', 'custom']

const parseDateKey = (value) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const getStartOfWeek = (date) => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? 6 : day - 1
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - diff)
  return start
}

const Dashboard = () => {
  const { allSales, productMap } = useSales()
  const [rangeType, setRangeType] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const activeRange = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (rangeType === 'yesterday') {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      return {
        startKey: getLocalISODate(yesterday),
        endKey: getLocalISODate(yesterday),
      }
    }

    if (rangeType === 'week') {
      const weekStart = getStartOfWeek(today)
      return {
        startKey: getLocalISODate(weekStart),
        endKey: getLocalISODate(today),
      }
    }

    if (rangeType === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        startKey: getLocalISODate(monthStart),
        endKey: getLocalISODate(today),
      }
    }

    if (rangeType === 'custom') {
      const from = customFrom || customTo
      const to = customTo || customFrom
      if (!from && !to) {
        const todayKey = getLocalISODate(today)
        return { startKey: todayKey, endKey: todayKey }
      }

      const fromDate = parseDateKey(from)
      const toDate = parseDateKey(to)
      if (!fromDate || !toDate) {
        const todayKey = getLocalISODate(today)
        return { startKey: todayKey, endKey: todayKey }
      }

      const startDate = fromDate <= toDate ? fromDate : toDate
      const endDate = fromDate <= toDate ? toDate : fromDate
      return {
        startKey: getLocalISODate(startDate),
        endKey: getLocalISODate(endDate),
      }
    }

    const todayKey = getLocalISODate(today)
    return { startKey: todayKey, endKey: todayKey }
  }, [customFrom, customTo, rangeType])

  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      const dayKey = toLocalDateKey(sale.date)
      if (!dayKey) return false
      return dayKey >= activeRange.startKey && dayKey <= activeRange.endKey
    })
  }, [activeRange.endKey, activeRange.startKey, allSales])

  const rangeSubtitle = useMemo(() => {
    if (activeRange.startKey === activeRange.endKey) {
      return new Date(activeRange.startKey).toLocaleDateString('en-IN')
    }

    return `${new Date(activeRange.startKey).toLocaleDateString('en-IN')} - ${new Date(activeRange.endKey).toLocaleDateString('en-IN')}`
  }, [activeRange.endKey, activeRange.startKey])

  const metrics = useMemo(() => {
    const totals = aggregateFinance(filteredSales, productMap)
    const totalRevenue = totals.revenue
    const totalCost = totals.cost
    const totalProfit = totals.profit
    const totalUnits = totals.units
    const avgOrderValue = filteredSales.length ? Math.round(totalRevenue / filteredSales.length) : 0
    const profitMargin = getProfitMarginPercent(totalProfit, totalRevenue)

    const flavorProfitTotals = filteredSales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const { profit } = getSaleFinance(sale, product)
      acc[sale.productId] = (acc[sale.productId] || 0) + profit
      return acc
    }, {})

    const topFlavorId = Object.entries(flavorProfitTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topFlavor = topFlavorId ? productMap[topFlavorId]?.name : '-'

    return { totalRevenue, totalCost, totalProfit, profitMargin, totalUnits, avgOrderValue, topFlavor }
  }, [filteredSales, productMap])

  const monthlyFinance = useMemo(() => {
    const map = new Map()

    filteredSales.forEach((sale) => {
      const date = new Date(sale.date)
      const monthNumber = String(date.getMonth() + 1).padStart(2, '0')
      const key = `${date.getFullYear()}-${monthNumber}`
      const label = date.toLocaleDateString('en-IN', { month: 'short' })
      const product = productMap[sale.productId]
      const { revenue, profit } = getSaleFinance(sale, product)
      map.set(key, {
        month: label,
        revenue: (map.get(key)?.revenue || 0) + revenue,
        profit: (map.get(key)?.profit || 0) + profit,
      })
    })

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map((item) => item[1])
  }, [filteredSales, productMap])

  const topFlavors = useMemo(() => {
    const flavorRevenue = filteredSales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const { profit } = getSaleFinance(sale, product)
      acc[sale.productId] = (acc[sale.productId] || 0) + profit
      return acc
    }, {})

    return Object.entries(flavorRevenue)
      .map(([id, profit]) => ({ name: productMap[id]?.name || id, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 7)
      .reverse()
  }, [filteredSales, productMap])

  const dailyTrend = useMemo(() => {
    const dayMap = new Map()

    filteredSales.forEach((sale) => {
      const dayKey = toLocalDateKey(sale.date)
      if (!dayKey) return

      const product = productMap[sale.productId]
      const finance = getSaleFinance(sale, product)
      const current = dayMap.get(dayKey) || { revenue: 0, profit: 0 }
      dayMap.set(dayKey, {
        revenue: current.revenue + finance.revenue,
        profit: current.profit + finance.profit,
      })
    })

    const trend = []
    const startDate = parseDateKey(activeRange.startKey)
    const endDate = parseDateKey(activeRange.endKey)
    if (!startDate || !endDate) return trend

    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      const dayKey = getLocalISODate(cursor)
      const totals = dayMap.get(dayKey) || { revenue: 0, profit: 0 }

      trend.push({
        date: cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: totals.revenue,
        profit: totals.profit,
      })
    }

    return trend
  }, [activeRange.endKey, activeRange.startKey, filteredSales, productMap])

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Track revenue, units, and flavor performance by date range.</p>
      </div>

      <div className="glass-card dashboard-filter-bar">
        <div className="dashboard-range-buttons" role="group" aria-label="Select dashboard date range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={rangeType === option ? 'active' : ''}
              onClick={() => setRangeType(option)}
            >
              {option === 'today'
                ? 'Today'
                : option === 'yesterday'
                  ? 'Yesterday'
                  : option === 'week'
                    ? 'This Week'
                    : option === 'month'
                      ? 'This Month'
                      : 'Custom Range'}
            </button>
          ))}
        </div>

        {rangeType === 'custom' ? (
          <div className="dashboard-custom-range">
            <label>
              From
              <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </label>
          </div>
        ) : null}

        <p className="dashboard-range-subtitle">Range: {rangeSubtitle}</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="For selected date range"
        />
        <MetricCard title="Total Cost" value={formatCurrency(metrics.totalCost)} subtitle="Estimated production cost" />
        <MetricCard title="Total Profit" value={formatCurrency(metrics.totalProfit)} subtitle="Revenue minus cost" />
        <MetricCard title="Profit Margin" value={`${metrics.profitMargin.toFixed(1)}%`} subtitle="Net from sales value" />
        <MetricCard title="Units Sold" value={metrics.totalUnits.toLocaleString('en-IN')} subtitle="Total kulfi sticks" />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          subtitle="Revenue per order"
        />
        <MetricCard title="Top Profit Flavor" value={metrics.topFlavor} subtitle="Highest profit contribution" />
      </div>

      <div className="chart-grid">
        <article className="glass-card chart-card">
          <h2>Revenue vs Profit Snapshot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyFinance}>
              <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#131b32', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#F2A623" radius={[8, 8, 0, 0]} />
              <Bar dataKey="profit" fill="#3ecf8e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="glass-card chart-card">
          <h2>Top 7 Flavors by Profit</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topFlavors} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <XAxis type="number" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                contentStyle={{ background: '#131b32', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="profit" fill="#3ecf8e" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="glass-card chart-card chart-card-wide">
          <h2>Revenue and Profit Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dailyTrend}>
              <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <XAxis dataKey="date" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#131b32', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="revenue" stroke="#F2A623" strokeWidth={3} dot={{ r: 2, fill: '#F2A623' }} />
              <Line type="monotone" dataKey="profit" stroke="#3ecf8e" strokeWidth={3} dot={{ r: 2, fill: '#3ecf8e' }} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </div>
    </section>
  )
}

export default Dashboard
