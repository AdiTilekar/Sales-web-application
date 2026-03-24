import { useMemo, useState } from 'react'
import ViewModeSwitch from '../components/ViewModeSwitch'
import { useSales } from '../context/SalesContext'
import { getLocalISODate } from '../utils/date'
import { downloadExcelReport } from '../utils/excelReport'
import { getProfitMarginPercent, getSaleFinance } from '../utils/finance'
import { handleImageError } from '../utils/image'

const ROWS_PER_PAGE = 20

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`

const getStartOfWeek = (date) => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - diff)
  start.setHours(0, 0, 0, 0)
  return start
}

const getPresetRange = (preset) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (preset === 'today') {
    const key = getLocalISODate(today)
    return { from: key, to: key }
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const key = getLocalISODate(yesterday)
    return { from: key, to: key }
  }

  if (preset === 'week') {
    return { from: getLocalISODate(getStartOfWeek(today)), to: getLocalISODate(today) }
  }

  if (preset === 'month') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: getLocalISODate(monthStart), to: getLocalISODate(today) }
  }

  return { from: '', to: '' }
}

const Records = () => {
  const { allSales, products, productMap, deleteSale } = useSales()
  const [flavorFilter, setFlavorFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [datePreset, setDatePreset] = useState('today')
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [page, setPage] = useState(1)

  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      if (flavorFilter !== 'all' && sale.productId !== flavorFilter) return false
      if (fromDate && sale.date < fromDate) return false
      if (toDate && sale.date > toDate) return false
      return true
    })
  }, [allSales, flavorFilter, fromDate, toDate])

  const sortedSales = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1

    return [...filteredSales].sort((left, right) => {
      if (sortField === 'date') {
        return left.date.localeCompare(right.date) * direction
      }

      const leftFinance = getSaleFinance(left, productMap[left.productId])
      const rightFinance = getSaleFinance(right, productMap[right.productId])

      if (sortField === 'units') {
        return (left.quantity - right.quantity) * direction
      }

      if (sortField === 'revenue') {
        return (leftFinance.revenue - rightFinance.revenue) * direction
      }

      if (sortField === 'profit') {
        return (leftFinance.profit - rightFinance.profit) * direction
      }

      return 0
    })
  }, [filteredSales, productMap, sortDirection, sortField])

  const totals = useMemo(() => {
    return sortedSales.reduce(
      (acc, sale) => {
        const finance = getSaleFinance(sale, productMap[sale.productId])
        acc.units += finance.quantity
        acc.revenue += finance.revenue
        acc.profit += finance.profit
        return acc
      },
      { units: 0, revenue: 0, profit: 0 },
    )
  }, [productMap, sortedSales])

  const pageCount = Math.max(1, Math.ceil(sortedSales.length / ROWS_PER_PAGE))
  const activePage = Math.min(page, pageCount)

  const currentRows = useMemo(() => {
    const startIndex = (activePage - 1) * ROWS_PER_PAGE
    return sortedSales.slice(startIndex, startIndex + ROWS_PER_PAGE)
  }, [activePage, sortedSales])

  const applyPreset = (preset) => {
    setDatePreset(preset)
    const range = getPresetRange(preset)
    setFromDate(range.from)
    setToDate(range.to)
    setPage(1)
  }

  const resetFilters = () => {
    setFlavorFilter('all')
    setDatePreset('all')
    setFromDate('')
    setToDate('')
    setSortField('date')
    setSortDirection('desc')
    setPage(1)
  }

  const toggleSort = (field) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection('desc')
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

  const exportAsExcel = async () => {
    if (sortedSales.length === 0) return

    const rows = sortedSales.map((sale) => {
      const product = productMap[sale.productId]
      const finance = getSaleFinance(sale, product)
      const margin = getProfitMarginPercent(finance.profit, finance.revenue)

      return [
        sale.date,
        product?.name || sale.productId,
        finance.quantity,
        finance.price,
        finance.revenue,
        finance.profit,
        margin.toFixed(2),
        sale.customer,
        sale.city,
      ]
    })

    await downloadExcelReport({
      reportTitle: 'Kulfi Sales Records Report',
      filePrefix: 'kulfi_sales_report',
      headers: ['Date', 'Flavor', 'Quantity', 'Price per Unit', 'Revenue', 'Profit', 'Margin %', 'Customer', 'City'],
      rows,
      summaryRows: [
        ['Filter Flavor', flavorFilter === 'all' ? 'All flavors' : productMap[flavorFilter]?.name || flavorFilter],
        ['Filter Date From', fromDate || '-'],
        ['Filter Date To', toDate || '-'],
        ['Sort', `${sortField} (${sortDirection})`],
        ['Total Units', totals.units],
        ['Total Revenue', totals.revenue],
        ['Total Profit', totals.profit],
      ],
      detailSheetName: 'Record Details',
    })
  }

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Sales Records</h2>
        <p>Filter, sort, and manage sales entries.</p>
      </div>

      <ViewModeSwitch />

      <div className="glass-card dashboard-filter-bar">
        <div className="dashboard-range-buttons" role="group" aria-label="Quick date presets">
          <button type="button" className={datePreset === 'all' ? 'active' : ''} onClick={() => applyPreset('all')}>
            All Time
          </button>
          <button type="button" className={datePreset === 'today' ? 'active' : ''} onClick={() => applyPreset('today')}>
            Today
          </button>
          <button type="button" className={datePreset === 'yesterday' ? 'active' : ''} onClick={() => applyPreset('yesterday')}>
            Yesterday
          </button>
          <button type="button" className={datePreset === 'week' ? 'active' : ''} onClick={() => applyPreset('week')}>
            This Week
          </button>
          <button type="button" className={datePreset === 'month' ? 'active' : ''} onClick={() => applyPreset('month')}>
            This Month
          </button>
        </div>

        <div className="active-filter-chips" aria-live="polite">
          {flavorFilter !== 'all' ? (
            <button type="button" className="filter-chip" onClick={() => setFlavorFilter('all')}>
              Flavor: {productMap[flavorFilter]?.name || flavorFilter} ×
            </button>
          ) : null}
          {fromDate ? (
            <button type="button" className="filter-chip" onClick={() => setFromDate('')}>
              From: {fromDate} ×
            </button>
          ) : null}
          {toDate ? (
            <button type="button" className="filter-chip" onClick={() => setToDate('')}>
              To: {toDate} ×
            </button>
          ) : null}
          <span className="filter-chip filter-chip-readonly">Sort: {sortField} {sortDirection === 'asc' ? '↑' : '↓'}</span>
        </div>
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
              setDatePreset('custom')
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
              setDatePreset('custom')
              setToDate(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <div className="filter-actions">
          <button type="button" className="outline-btn" onClick={resetFilters}>
            Clear
          </button>
          <button type="button" className="cta-btn export-btn" onClick={exportAsExcel} disabled={sortedSales.length === 0}>
            Export as Excel Report
          </button>
        </div>
      </div>

      <div className="glass-card table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="sort-header" onClick={() => toggleSort('date')}>
                  Date {sortField === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Flavor</th>
              <th>
                <button type="button" className="sort-header" onClick={() => toggleSort('units')}>
                  Qty {sortField === 'units' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Price/unit</th>
              <th>
                <button type="button" className="sort-header" onClick={() => toggleSort('revenue')}>
                  Revenue {sortField === 'revenue' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type="button" className="sort-header" onClick={() => toggleSort('profit')}>
                  Profit {sortField === 'profit' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Customer</th>
              <th>City</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-row">
                  No sales found with the current filters.
                </td>
              </tr>
            ) : (
              currentRows.map((sale) => {
                const product = productMap[sale.productId]
                const finance = getSaleFinance(sale, product)

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
                    <td>{formatCurrency(finance.price)}</td>
                    <td>{formatCurrency(finance.revenue)}</td>
                    <td>{formatCurrency(finance.profit)}</td>
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
              <td>{formatCurrency(totals.profit)}</td>
              <td colSpan="3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mobile-sales-list" aria-label="Sales cards for mobile">
        {currentRows.length === 0 ? (
          <div className="glass-card mobile-sale-card mobile-sale-empty">No sales found with the current filters.</div>
        ) : (
          currentRows.map((sale) => {
            const product = productMap[sale.productId]
            const finance = getSaleFinance(sale, product)

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
                  <span>Revenue: {formatCurrency(finance.revenue)}</span>
                  <span>Profit: {formatCurrency(finance.profit)}</span>
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

export default Records
