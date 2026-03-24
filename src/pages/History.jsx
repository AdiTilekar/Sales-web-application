import { useMemo, useState } from 'react'
import MetricCard from '../components/MetricCard'
import { useSales } from '../context/SalesContext'
import { handleImageError } from '../utils/image'
import { downloadExcelReport } from '../utils/excelReport'
import { aggregateFinance, getProfitMarginPercent, getSaleFinance } from '../utils/finance'

const ROWS_PER_PAGE = 20

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`
const formatMonthLabel = (dateKey) => {
  const [year, month] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

const History = () => {
  const { sales, allSales, products, productMap, deleteSale } = useSales()
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

  const exportAsExcel = async () => {
    if (filteredSales.length === 0) return

    const headers = ['Date', 'Flavor', 'Quantity', 'Price per Unit', 'Revenue', 'Cost', 'Profit', 'Profit Margin %', 'Customer', 'City']

    const dataRows = filteredSales.map((sale) => {
      const product = productMap[sale.productId]
      const { price, revenue, cost, profit } = getSaleFinance(sale, product)
      const margin = getProfitMarginPercent(profit, revenue)

      return [sale.date, product?.name || sale.productId, sale.quantity, price, revenue, cost, profit, margin.toFixed(2), sale.customer, sale.city]
    })

    const summaryRows = [
      ['Filter Flavor', flavorFilter === 'all' ? 'All flavors' : productMap[flavorFilter]?.name || flavorFilter],
      ['Filter Date From', fromDate || '-'],
      ['Filter Date To', toDate || '-'],
      ['Total Units', totals.units],
      ['Total Revenue', totals.revenue],
      ['Total Cost', totals.cost],
      ['Total Profit', totals.profit],
      ['Profit Margin %', totals.margin.toFixed(2)],
      ['Covered Days', totals.days.size],
    ]

    await downloadExcelReport({
      reportTitle: 'Kulfi Sales History Report',
      filePrefix: 'kulfi_sales_today_history',
      headers,
      rows: dataRows,
      summaryRows,
      detailSheetName: 'History Details',
    })
  }

  const exportDailySummaryPdf = async () => {
    if (filteredSales.length === 0) return

    const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const autoTable = autoTableModule.default
    const doc = new jsPDF()
    const topFlavorsMap = filteredSales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const name = product?.name || sale.productId
      const { revenue, profit } = getSaleFinance(sale, product)
      const current = acc.get(name) || { units: 0, revenue: 0, profit: 0 }
      acc.set(name, {
        units: current.units + sale.quantity,
        revenue: current.revenue + revenue,
        profit: current.profit + profit,
      })
      return acc
    }, new Map())

    const topFlavorRows = [...topFlavorsMap.entries()]
      .map(([name, values]) => [
        name,
        values.units.toLocaleString('en-IN'),
        values.revenue.toFixed(2),
        values.profit.toFixed(2),
      ])
      .sort((a, b) => Number(b[3]) - Number(a[3]))
      .slice(0, 8)

    doc.setFontSize(16)
    doc.text('Shree Ganesh Kulfi - Daily Summary', 14, 16)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23)
    doc.text(
      `Filters: Flavor ${flavorFilter === 'all' ? 'All' : productMap[flavorFilter]?.name || flavorFilter}, From ${fromDate || '-'} To ${toDate || '-'}`,
      14,
      29,
    )

    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Value']],
      body: [
        ['Total Orders', filteredSales.length.toLocaleString('en-IN')],
        ['Total Units', totals.units.toLocaleString('en-IN')],
        ['Total Revenue', totals.revenue.toFixed(2)],
        ['Total Cost', totals.cost.toFixed(2)],
        ['Total Profit', totals.profit.toFixed(2)],
        ['Profit Margin %', totals.margin.toFixed(2)],
        ['Covered Days', totals.days.size.toLocaleString('en-IN')],
      ],
      theme: 'striped',
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Top Flavor', 'Units', 'Revenue', 'Profit']],
      body: topFlavorRows.length ? topFlavorRows : [['No data', '-', '-', '-']],
      theme: 'grid',
    })

    const fileDate = new Date().toISOString().slice(0, 10)
    doc.save(`kulfi_daily_summary_${fileDate}.pdf`)
  }

  const exportLatestInvoicePdf = async () => {
    const invoiceSale = filteredSales[0]
    if (!invoiceSale) return

    const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const autoTable = autoTableModule.default
    const doc = new jsPDF()
    const product = productMap[invoiceSale.productId]
    const finance = getSaleFinance(invoiceSale, product)
    const totalAmount = finance.revenue

    doc.setFontSize(16)
    doc.text('Shree Ganesh Kulfi - Tax Invoice', 14, 16)
    doc.setFontSize(10)
    doc.text(`Invoice Date: ${new Date(invoiceSale.date).toLocaleDateString('en-IN')}`, 14, 24)
    doc.text(`Customer: ${invoiceSale.customer || 'Walk-in Customer'}`, 14, 30)
    doc.text(`City: ${invoiceSale.city || 'Pune'}`, 14, 36)
    doc.text(`Invoice Ref: ${invoiceSale.id}`, 14, 42)

    autoTable(doc, {
      startY: 48,
      head: [['Item', 'Qty', 'Rate', 'Amount']],
      body: [[product?.name || invoiceSale.productId, finance.quantity, finance.price.toFixed(2), totalAmount.toFixed(2)]],
      theme: 'grid',
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Summary', 'Amount']],
      body: [
        ['Subtotal', totalAmount.toFixed(2)],
        ['Grand Total', totalAmount.toFixed(2)],
      ],
      theme: 'striped',
      styles: { halign: 'right' },
      columnStyles: { 0: { halign: 'left' } },
    })

    const fileDate = new Date().toISOString().slice(0, 10)
    doc.save(`kulfi_invoice_${fileDate}_${invoiceSale.id}.pdf`)
  }

  const exportMonthlyProfitReport = async () => {
    if (allSales.length === 0) return

    const monthlyMap = allSales.reduce((acc, sale) => {
      const monthKey = String(sale.date || '').slice(0, 7)
      if (!monthKey) return acc

      const product = productMap[sale.productId]
      const finance = getSaleFinance(sale, product)
      const current = acc.get(monthKey) || { units: 0, revenue: 0, cost: 0, profit: 0, orders: 0 }
      acc.set(monthKey, {
        units: current.units + finance.quantity,
        revenue: current.revenue + finance.revenue,
        cost: current.cost + finance.cost,
        profit: current.profit + finance.profit,
        orders: current.orders + 1,
      })
      return acc
    }, new Map())

    const rows = [...monthlyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, value]) => {
        const margin = getProfitMarginPercent(value.profit, value.revenue)
        return [
          monthKey,
          formatMonthLabel(monthKey),
          value.orders,
          value.units,
          value.revenue,
          value.cost,
          value.profit,
          margin.toFixed(2),
        ]
      })

    await downloadExcelReport({
      reportTitle: 'Kulfi Monthly Profit Report',
      filePrefix: 'kulfi_monthly_profit',
      headers: ['Month Key', 'Month', 'Orders', 'Units', 'Revenue', 'Cost', 'Profit', 'Margin %'],
      rows,
      summaryRows: [
        ['Total Months', rows.length],
        ['Generated For', 'All available sales records'],
      ],
      detailSheetName: 'Monthly Profit',
    })
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
          <button
            type="button"
            className="outline-btn export-btn"
            onClick={exportDailySummaryPdf}
            disabled={filteredSales.length === 0}
          >
            PDF Daily Summary
          </button>
          <button
            type="button"
            className="outline-btn export-btn"
            onClick={exportLatestInvoicePdf}
            disabled={filteredSales.length === 0}
          >
            PDF Invoice
          </button>
          <button
            type="button"
            className="outline-btn export-btn"
            onClick={exportMonthlyProfitReport}
            disabled={allSales.length === 0}
          >
            Monthly Profit Report
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