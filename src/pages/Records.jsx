import { useMemo, useState } from 'react'
import { useSales } from '../context/SalesContext'

const ROWS_PER_PAGE = 20

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`

const Records = () => {
  const { sales, products, productMap, deleteSale } = useSales()
  const [flavorFilter, setFlavorFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (flavorFilter !== 'all' && sale.productId !== flavorFilter) return false
      if (fromDate && sale.date < fromDate) return false
      if (toDate && sale.date > toDate) return false
      return true
    })
  }, [flavorFilter, fromDate, sales, toDate])

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        const product = productMap[sale.productId]
        acc.units += sale.quantity
        acc.revenue += sale.quantity * (product?.price || 0)
        return acc
      },
      { units: 0, revenue: 0 },
    )
  }, [filteredSales, productMap])

  const pageCount = Math.max(1, Math.ceil(filteredSales.length / ROWS_PER_PAGE))

  const currentRows = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE
    return filteredSales.slice(startIndex, startIndex + ROWS_PER_PAGE)
  }, [filteredSales, page])

  const resetFilters = () => {
    setFlavorFilter('all')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const exportAsExcel = () => {
    if (filteredSales.length === 0) return

    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

    const headers = ['Date', 'Flavor', 'Quantity', 'Price per Unit', 'Revenue', 'Customer', 'City']

    const dataRows = filteredSales.map((sale) => {
      const product = productMap[sale.productId]
      const pricePerUnit = product?.price || 0
      const revenue = sale.quantity * pricePerUnit

      return [sale.date, product?.name || sale.productId, sale.quantity, pricePerUnit, revenue, sale.customer, sale.city]
    })

    const summaryRows = [
      ['Generated On', new Date().toLocaleString('en-IN')],
      ['Filter Flavor', flavorFilter === 'all' ? 'All flavors' : productMap[flavorFilter]?.name || flavorFilter],
      ['Filter Date From', fromDate || '-'],
      ['Filter Date To', toDate || '-'],
      ['Total Rows', filteredSales.length],
      ['Total Units', totals.units],
      ['Total Revenue', totals.revenue],
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
    link.download = `kulfi_sales_report_${fileDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Sales Records</h2>
        <p>Filter, review, and manage all saved sales entries.</p>
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
            Export as Excel Report
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
              <th>Customer</th>
              <th>City</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  No sales found for current filters.
                </td>
              </tr>
            ) : (
              currentRows.map((sale) => {
                const product = productMap[sale.productId]
                const revenue = sale.quantity * (product?.price || 0)

                return (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flavor-cell">
                        <img src={product?.image} alt={product?.name} />
                        <span>{product?.name}</span>
                      </div>
                    </td>
                    <td>{sale.quantity.toLocaleString('en-IN')}</td>
                    <td>{formatCurrency(product?.price || 0)}</td>
                    <td>{formatCurrency(revenue)}</td>
                    <td>{sale.customer}</td>
                    <td>{sale.city}</td>
                    <td>
                      <button type="button" className="delete-btn" onClick={() => deleteSale(sale.id)}>
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
              <td colSpan="3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="pagination">
        <button type="button" className="outline-btn" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Prev
        </button>
        <span>
          Page {page} of {pageCount}
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
