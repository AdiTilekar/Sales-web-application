import { useMemo } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ViewModeSwitch from '../components/ViewModeSwitch'
import { useSales } from '../context/SalesContext'

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`

const PIE_COLORS = ['#F2A623', '#ffd57f', '#ffbe55', '#f6ca71', '#f3b23d', '#f8db9e']

const FlavorAnalysis = () => {
  const { sales, productMap } = useSales()

  const data = useMemo(() => {
    const totals = sales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const revenue = sale.quantity * (product?.price || 0)

      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          id: sale.productId,
          name: product?.name || sale.productId,
          image: product?.image,
          units: 0,
          revenue: 0,
        }
      }

      acc[sale.productId].units += sale.quantity
      acc[sale.productId].revenue += revenue
      return acc
    }, {})

    return Object.values(totals).sort((a, b) => b.revenue - a.revenue)
  }, [productMap, sales])

  const totalUnits = data.reduce((sum, item) => sum + item.units, 0)

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Flavor Analysis</h2>
        <p>Compare revenue performance and unit share across today&apos;s kulfi sales.</p>
      </div>

      <ViewModeSwitch />

      <div className="analysis-grid">
        <article className="glass-card chart-card">
          <h2>Revenue by Flavor</h2>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} angle={-25} height={80} />
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
          <h2>Units Share</h2>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie data={data} dataKey="units" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={65}>
                {data.map((item, index) => (
                  <Cell key={item.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#131b32', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => `${Number(value).toLocaleString('en-IN')} units`}
              />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </div>

      <div className="glass-card leaderboard-wrap">
        <h2>Flavor Leaderboard</h2>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Flavor</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>% Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const share = totalUnits ? (item.units / totalUnits) * 100 : 0
              return (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="flavor-cell">
                      <img src={item.image} alt={item.name} />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td>{item.units.toLocaleString('en-IN')}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>
                    <div className="share-wrap">
                      <span>{share.toFixed(1)}%</span>
                      <div className="progress">
                        <div className="progress-fill" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default FlavorAnalysis
