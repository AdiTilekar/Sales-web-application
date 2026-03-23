import { useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSales } from '../context/SalesContext'
import { handleImageError } from '../utils/image'
import { getProfitMarginPercent, getSaleFinance } from '../utils/finance'

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`

const PIE_COLORS = ['#F2A623', '#ffd57f', '#ffbe55', '#f6ca71', '#f3b23d', '#f8db9e']
const getMonthKey = (dateValue) => {
  const date = new Date(dateValue)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

const FlavorAnalysis = () => {
  const { allSales, productMap } = useSales()
  const [compareMode, setCompareMode] = useState('total')

  const monthOptions = useMemo(() => {
    const seen = new Set()

    allSales.forEach((sale) => {
      seen.add(getMonthKey(sale.date))
    })

    return [...seen].sort((a, b) => b.localeCompare(a))
  }, [allSales])

  const [selectedMonth, setSelectedMonth] = useState('')

  const effectiveMonth = selectedMonth || monthOptions[0] || ''

  const scopedSales = useMemo(() => {
    if (compareMode === 'month' && effectiveMonth) {
      return allSales.filter((sale) => getMonthKey(sale.date) === effectiveMonth)
    }

    return allSales
  }, [allSales, compareMode, effectiveMonth])

  const data = useMemo(() => {
    const totals = scopedSales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const { revenue, cost, profit } = getSaleFinance(sale, product)

      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          id: sale.productId,
          name: product?.name || sale.productId,
          image: product?.image,
          units: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        }
      }

      acc[sale.productId].units += sale.quantity
      acc[sale.productId].revenue += revenue
      acc[sale.productId].cost += cost
      acc[sale.productId].profit += profit
      return acc
    }, {})

    return Object.values(totals)
      .map((item) => ({
        ...item,
        margin: getProfitMarginPercent(item.profit, item.revenue),
      }))
      .sort((a, b) => b.profit - a.profit)
  }, [productMap, scopedSales])

  const totalUnits = data.reduce((sum, item) => sum + item.units, 0)
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0)
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0)
  const totalMargin = getProfitMarginPercent(totalProfit, totalRevenue)

  const compareLabel =
    compareMode === 'month' && effectiveMonth ? `Month: ${effectiveMonth}` : 'Total Sales: All Time'

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Flavor Analysis</h2>
        <p>Compare flavor performance by month or across total sales.</p>
      </div>

      <div className="glass-card filter-bar">
        <label>
          Compare by
          <select value={compareMode} onChange={(event) => setCompareMode(event.target.value)}>
            <option value="total">Total Sales</option>
            <option value="month">Month</option>
          </select>
        </label>

        {compareMode === 'month' ? (
          <label>
            Month
            <select value={effectiveMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              {monthOptions.length === 0 ? <option value="">No data</option> : null}
              {monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {monthKey}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="filter-actions" aria-live="polite">
          <span>{compareLabel}</span>
          <span>
            Units: {totalUnits.toLocaleString('en-IN')} | Revenue: {formatCurrency(totalRevenue)} | Cost: {formatCurrency(totalCost)} | Profit: {formatCurrency(totalProfit)} | Margin: {totalMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="analysis-grid">
        <article className="glass-card chart-card">
          <h2>Profit by Flavor</h2>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fill: '#fff' }} axisLine={false} tickLine={false} angle={-25} height={80} />
              <YAxis tick={{ fill: '#fff' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#131b32', border: '1px solid rgba(255,255,255,0.2)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="profit" fill="#3ecf8e" radius={[8, 8, 0, 0]} />
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
              <th>Cost</th>
              <th>Profit</th>
              <th>Margin</th>
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
                      <img src={item.image} alt={item.name} onError={handleImageError} />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td>{item.units.toLocaleString('en-IN')}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.cost)}</td>
                  <td>{formatCurrency(item.profit)}</td>
                  <td>{item.margin.toFixed(1)}%</td>
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
