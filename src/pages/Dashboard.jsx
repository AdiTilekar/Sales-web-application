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
const TREND_WINDOWS = [7, 30, 90]

const Dashboard = () => {
  const { sales, allSales, productMap } = useSales()
  const [trendDays, setTrendDays] = useState(30)

  const metrics = useMemo(() => {
    const totals = aggregateFinance(sales, productMap)
    const totalRevenue = totals.revenue
    const totalCost = totals.cost
    const totalProfit = totals.profit
    const totalUnits = totals.units
    const avgOrderValue = sales.length ? Math.round(totalRevenue / sales.length) : 0
    const profitMargin = getProfitMarginPercent(totalProfit, totalRevenue)

    const flavorProfitTotals = sales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const { profit } = getSaleFinance(sale, product)
      acc[sale.productId] = (acc[sale.productId] || 0) + profit
      return acc
    }, {})

    const topFlavorId = Object.entries(flavorProfitTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topFlavor = topFlavorId ? productMap[topFlavorId]?.name : '-'

    return { totalRevenue, totalCost, totalProfit, profitMargin, totalUnits, avgOrderValue, topFlavor }
  }, [productMap, sales])

  const monthlyFinance = useMemo(() => {
    const map = new Map()

    allSales.forEach((sale) => {
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
  }, [allSales, productMap])

  const topFlavors = useMemo(() => {
    const flavorRevenue = sales.reduce((acc, sale) => {
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
  }, [productMap, sales])

  const dailyTrend = useMemo(() => {
    const dayMap = new Map()

    allSales.forEach((sale) => {
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
    for (let offset = trendDays - 1; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - offset)
      const dayKey = getLocalISODate(date)
      const totals = dayMap.get(dayKey) || { revenue: 0, profit: 0 }

      trend.push({
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: totals.revenue,
        profit: totals.profit,
      })
    }

    return trend
  }, [allSales, productMap, trendDays])

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Track today&apos;s revenue, units, and top-performing flavors.</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="Today&apos;s recorded orders"
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
          <div className="chart-card-header">
            <h2>Revenue and Profit Trend</h2>
            <div className="trend-range-toggle" role="group" aria-label="Select trend chart date range">
              {TREND_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  className={trendDays === days ? 'active' : ''}
                  onClick={() => setTrendDays(days)}
                  aria-pressed={trendDays === days}
                >
                  Last {days} days
                </button>
              ))}
            </div>
          </div>
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
