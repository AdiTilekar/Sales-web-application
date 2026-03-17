import { useMemo } from 'react'
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
import ViewModeSwitch from '../components/ViewModeSwitch'
import { useSales } from '../context/SalesContext'

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`

const Dashboard = () => {
  const { sales, productMap } = useSales()

  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.quantity * (productMap[sale.productId]?.price || 0),
      0,
    )
    const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0)
    const avgOrderValue = sales.length ? Math.round(totalRevenue / sales.length) : 0

    const flavorTotals = sales.reduce((acc, sale) => {
      acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity
      return acc
    }, {})

    const topFlavorId = Object.entries(flavorTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topFlavor = topFlavorId ? productMap[topFlavorId]?.name : '-'

    return { totalRevenue, totalUnits, avgOrderValue, topFlavor }
  }, [productMap, sales])

  const monthlyRevenue = useMemo(() => {
    const map = new Map()

    sales.forEach((sale) => {
      const date = new Date(sale.date)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const label = date.toLocaleDateString('en-IN', { month: 'short' })
      const revenue = sale.quantity * (productMap[sale.productId]?.price || 0)
      map.set(key, { month: label, revenue: (map.get(key)?.revenue || 0) + revenue })
    })

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map((item) => item[1])
  }, [productMap, sales])

  const topFlavors = useMemo(() => {
    const flavorRevenue = sales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const revenue = sale.quantity * (product?.price || 0)
      acc[sale.productId] = (acc[sale.productId] || 0) + revenue
      return acc
    }, {})

    return Object.entries(flavorRevenue)
      .map(([id, revenue]) => ({ name: productMap[id]?.name || id, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7)
      .reverse()
  }, [productMap, sales])

  const dailyTrend = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const revenue = sales.reduce((sum, sale) => {
      if (sale.date !== today) return sum
      return sum + sale.quantity * (productMap[sale.productId]?.price || 0)
    }, 0)

    return [
      {
        date: new Date(today).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue,
      },
    ]
  }, [productMap, sales])

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Track today&apos;s revenue, units, and top-performing flavors.</p>
      </div>

      <ViewModeSwitch />

      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="Today&apos;s recorded orders"
        />
        <MetricCard title="Units Sold" value={metrics.totalUnits.toLocaleString('en-IN')} subtitle="Total kulfi sticks" />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          subtitle="Revenue per order"
        />
        <MetricCard title="Top Flavor" value={metrics.topFlavor} subtitle="Highest units sold" />
      </div>

      <div className="chart-grid">
        <article className="glass-card chart-card">
          <h2>Today&apos;s Revenue Snapshot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#131b32', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#F2A623" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="glass-card chart-card">
          <h2>Top 7 Flavors by Revenue</h2>
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
              <Bar dataKey="revenue" fill="#F2A623" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="glass-card chart-card chart-card-wide">
          <h2>Today&apos;s Sales Trend</h2>
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
            </LineChart>
          </ResponsiveContainer>
        </article>
      </div>
    </section>
  )
}

export default Dashboard
