import { useMemo, useState } from 'react'
import MetricCard from '../components/MetricCard'
import { useSales } from '../context/SalesContext'
import { handleImageError } from '../utils/image'
import { aggregateFinance, getProfitMarginPercent, getSaleFinance } from '../utils/finance'

const ROWS_PER_PAGE = 20

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`

const History = () => {
  const { sales, products, productMap, deleteSale } = useSales()
  const [flavorFilter, setFlavorFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const recentSale = useMemo(() => sales[0] || null, [sales])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (flavorFilter !== 'all' && sale.productId !== flavorFilter) return false
      if (fromDate && sale.date < fromDate) return false
      if (toDate && sale.date > toDate) return false
      return true
    })
  }, [flavorFilter, fromDate, sales, toDate])

  const totals = useMemo(() => {
    const financeTotals = aggregateFinance(filteredSales, productMap)
    const coveredDays = filteredSales.reduce((acc, sale) => {
      acc.add(sale.date)
      return acc
    }, new Set())

    return {
      ...financeTotals,
      margin: getProfitMarginPercent(financeTotals.profit, financeTotals.revenue),
      days: coveredDays,
    }
  }, [filteredSales, productMap])

  const pageCount = Math.max(1, Math.ceil(filteredSales.length / ROWS_PER_PAGE))
  const activePage = Math.min(page, pageCount)

  const currentRows = useMemo(() => {
    const startIndex = (activePage - 1) * ROWS_PER_PAGE
    return filteredSales.slice(startIndex, startIndex + ROWS_PER_PAGE)
  }, [activePage, filteredSales])

  const resetFilters = () => {
    setFlavorFilter('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const handleDeleteSale = async (sale) => {
    const product = productMap[sale.productId]
    const label = `${product?.name || 'Unknown flavor'} on ${new Date(sale.date).toLocaleDateString('en-IN')}`
    const shouldDelete = window.confirm(`Delete sale: ${label}?`)
    if (!shouldDelete) return
    const isDeleted = await deleteSale(sale.id)
    if (!isDeleted) {
      window.alert('Could not delete sale. Your current access does not allow delete in cloud mode.')
    }
  }

  const exportAsExcel = () => {
    if (filteredSales.length === 0) return

    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

    const headers = ['Date', 'Flavor', 'Quantity', 'Price per Unit', 'Revenue', 'Cost', 'Profit', 'Profit Margin %', 'Customer', 'City']

    const dataRows = filteredSales.map((sale) => {
      const product = productMap[sale.productId]
      const { price, revenue, cost, profit } = getSaleFinance(sale, product)
      const margin = getProfitMarginPercent(profit, revenue)

      return [sale.date, product?.name || sale.productId, sale.quantity, price, revenue, cost, profit, margin.toFixed(2), sale.customer, sale.city]
    })

    const summaryRows = [
      ['Generated On', new Date().toLocaleString('en-IN')],
      ['Filter Flavor', flavorFilter === 'all' ? 'All flavors' : productMap[flavorFilter]?.name || flavorFilter],
      ['Filter Date From', fromDate || '-'],
      ['Filter Date To', toDate || '-'],
      ['Total Rows', filteredSales.length],
      ['Total Units', totals.units],
      ['Total Revenue', totals.revenue],
      ['Total Cost', totals.cost],
      ['Total Profit', totals.profit],
      ['Profit Margin %', totals.margin.toFixed(2)],
      ['Covered Days', totals.days.size],
    ]

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...dataRows.map((row) => row.map(escapeCsv).join(',')),
      '',
      '"Summary"',
      ...summaryRows.map((row) => row.map(escapeCsv).join(',')),
    ]
    const csvContent = `\uFEFF${csvLines.join('\n')}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    const fileDate = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `kulfi_sales_today_history_${fileDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Today&apos;s Sales History</h2>
        <p>Review and export today&apos;s sales records.</p>
      </div>

      <div className="glass-card mobile-help" role="status" aria-live="polite">
        {recentSale ? (
          <p>
            Recent Sale: {productMap[recentSale.productId]?.name || recentSale.productId} • Qty{' '}
            {recentSale.quantity.toLocaleString('en-IN')} • {formatCurrency(getSaleFinance(recentSale, productMap[recentSale.productId]).profit)} profit •{' '}
            {new Date(recentSale.date).toLocaleDateString('en-IN')}
          </p>
        ) : (
          <p>Recent Sale: No sales recorded yet.</p>
        )}
      </div>

      <div className="history-summary">
        <MetricCard title="Today Revenue" value={formatCurrency(totals.revenue)} subtitle="Across today&apos;s filtered entries" />
        <MetricCard title="Today Cost" value={formatCurrency(totals.cost)} subtitle="Estimated production cost" />
        <MetricCard title="Today Profit" value={formatCurrency(totals.profit)} subtitle="Revenue minus cost" />
        <MetricCard title="Profit Margin" value={`${totals.margin.toFixed(1)}%`} subtitle="Profitability of filtered sales" />
        <MetricCard title="Today Units" value={totals.units.toLocaleString('en-IN')} subtitle="Today&apos;s kulfi units" />
        <MetricCard title="Days Covered" value={totals.days.size.toLocaleString('en-IN')} subtitle="Unique dates in current filters" />
      </div>

      <div className="glass-card filter-bar">
        <label>
          Flavor
          <select
            value={flavorFilter}
            onChange={(event) => {
              setFlavorFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All flavors</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date from
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <label>
          Date to
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <div className="filter-actions">
          <button type="button" className="outline-btn" onClick={resetFilters}>
            Clear
          </button>
          <button
            type="button"
            className="cta-btn export-btn"
            onClick={exportAsExcel}
            disabled={filteredSales.length === 0}
          >
            Export History Report
          </button>
        </div>
      </div>

      <div className="glass-card table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Flavor</th>
              <th>Qty</th>
              <th>Price/unit</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Customer</th>
              <th>City</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-row">
                  No sales found for today with the current filters.
                </td>
              </tr>
            ) : (
              currentRows.map((sale) => {
                const product = productMap[sale.productId]
                const { revenue, cost, profit } = getSaleFinance(sale, product)

                return (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flavor-cell">
                        <img src={product?.image} alt={product?.name} onError={handleImageError} />
                        <span>{product?.name}</span>
                      </div>
                    </td>
                    <td>{sale.quantity.toLocaleString('en-IN')}</td>
                    <td>{formatCurrency(product?.price || 0)}</td>
                    <td>{formatCurrency(revenue)}</td>
                    <td>{formatCurrency(cost)}</td>
                    <td>{formatCurrency(profit)}</td>
                    <td>{sale.customer}</td>
                    <td>{sale.city}</td>
                    <td>
                      <button type="button" className="delete-btn" onClick={() => handleDeleteSale(sale)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Filtered Totals</td>
              <td>{totals.units.toLocaleString('en-IN')}</td>
              <td>-</td>
              <td>{formatCurrency(totals.revenue)}</td>
              <td>{formatCurrency(totals.cost)}</td>
              <td>{formatCurrency(totals.profit)}</td>
              <td colSpan="3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mobile-sales-list" aria-label="History cards for mobile">
        {currentRows.length === 0 ? (
          <div className="glass-card mobile-sale-card mobile-sale-empty">No sales found for today with the current filters.</div>
        ) : (
          currentRows.map((sale) => {
            const product = productMap[sale.productId]
            const { revenue, profit } = getSaleFinance(sale, product)

            return (
              <article key={sale.id} className="glass-card mobile-sale-card">
                <div className="mobile-sale-top">
                  <div className="flavor-cell">
                    <img src={product?.image} alt={product?.name} onError={handleImageError} />
                    <div>
                      <strong>{product?.name || sale.productId}</strong>
                      <p>{new Date(sale.date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <button type="button" className="delete-btn" onClick={() => handleDeleteSale(sale)}>
                    Delete
                  </button>
                </div>
                <div className="mobile-sale-meta">
                  <span>Qty: {sale.quantity.toLocaleString('en-IN')}</span>
                  <span>Revenue: {formatCurrency(revenue)}</span>
                  <span>Profit: {formatCurrency(profit)}</span>
                  <span>{sale.customer}</span>
                  <span>{sale.city}</span>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="pagination">
        <button type="button" className="outline-btn" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Prev
        </button>
        <span>
          Page {activePage} of {pageCount}
        </span>
        <button
          type="button"
          className="outline-btn"
          onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
        >
          Next
        </button>
      </div>
    </section>
  )
}

export default History