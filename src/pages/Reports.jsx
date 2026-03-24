import { useEffect, useMemo, useState } from 'react'
import ToastNotification from '../components/ToastNotification'
import { useSales } from '../context/SalesContext'
import { getLocalISODate } from '../utils/date'
import { downloadExcelReport } from '../utils/excelReport'
import { getProfitMarginPercent, getSaleFinance } from '../utils/finance'

const PRESET_OPTIONS = ['all', 'today', 'yesterday', 'week', 'month']

const formatBytes = (value) => {
  if (!value || value < 1024) return `${value || 0} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

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

const triggerDownload = (blob, fileName) => {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return { fileName, sizeBytes: blob.size }
}

const Reports = () => {
  const { allSales, products, productMap } = useSales()
  const [flavorFilter, setFlavorFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [preset, setPreset] = useState('all')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (!showToast) return undefined
    const timer = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(timer)
  }, [showToast])

  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      if (flavorFilter !== 'all' && sale.productId !== flavorFilter) return false
      if (fromDate && sale.date < fromDate) return false
      if (toDate && sale.date > toDate) return false
      return true
    })
  }, [allSales, flavorFilter, fromDate, toDate])

  const summary = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        const product = productMap[sale.productId]
        const finance = getSaleFinance(sale, product)
        acc.orders += 1
        acc.units += finance.quantity
        acc.revenue += finance.revenue
        acc.cost += finance.cost
        acc.profit += finance.profit
        return acc
      },
      { orders: 0, units: 0, revenue: 0, cost: 0, profit: 0 },
    )
  }, [filteredSales, productMap])

  const announceExport = (result) => {
    if (!result) return
    setToastMessage(`Exported ${result.fileName} (${formatBytes(result.sizeBytes)})`)
    setShowToast(true)
  }

  const applyPreset = (nextPreset) => {
    setPreset(nextPreset)
    const range = getPresetRange(nextPreset)
    setFromDate(range.from)
    setToDate(range.to)
  }

  const exportDailySummaryPdf = async () => {
    if (filteredSales.length === 0) return

    const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const autoTable = autoTableModule.default
    const doc = new jsPDF()

    const topFlavors = filteredSales.reduce((acc, sale) => {
      const product = productMap[sale.productId]
      const name = product?.name || sale.productId
      const finance = getSaleFinance(sale, product)
      const current = acc.get(name) || { units: 0, revenue: 0, profit: 0 }
      acc.set(name, {
        units: current.units + finance.quantity,
        revenue: current.revenue + finance.revenue,
        profit: current.profit + finance.profit,
      })
      return acc
    }, new Map())

    const topRows = [...topFlavors.entries()]
      .map(([name, val]) => [name, val.units.toLocaleString('en-IN'), val.revenue.toFixed(2), val.profit.toFixed(2)])
      .sort((a, b) => Number(b[3]) - Number(a[3]))
      .slice(0, 10)

    const margin = getProfitMarginPercent(summary.profit, summary.revenue)

    doc.setFontSize(16)
    doc.text('Shree Ganesh Kulfi - Daily Summary', 14, 16)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23)
    doc.text(`Filters: Flavor ${flavorFilter === 'all' ? 'All' : productMap[flavorFilter]?.name || flavorFilter}, From ${fromDate || '-'} To ${toDate || '-'}`, 14, 29)

    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Value']],
      body: [
        ['Total Orders', summary.orders.toLocaleString('en-IN')],
        ['Total Units', summary.units.toLocaleString('en-IN')],
        ['Revenue', summary.revenue.toFixed(2)],
        ['Cost', summary.cost.toFixed(2)],
        ['Profit', summary.profit.toFixed(2)],
        ['Margin %', margin.toFixed(2)],
      ],
      theme: 'striped',
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Flavor', 'Units', 'Revenue', 'Profit']],
      body: topRows.length ? topRows : [['No data', '-', '-', '-']],
      theme: 'grid',
    })

    const fileDate = new Date().toISOString().slice(0, 10)
    const fileName = `kulfi_daily_summary_${fileDate}.pdf`
    const blob = doc.output('blob')
    announceExport(triggerDownload(blob, fileName))
  }

  const exportInvoicePdf = async () => {
    const sale = filteredSales[0]
    if (!sale) return

    const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const autoTable = autoTableModule.default
    const doc = new jsPDF()

    const product = productMap[sale.productId]
    const finance = getSaleFinance(sale, product)

    doc.setFontSize(16)
    doc.text('Shree Ganesh Kulfi - Invoice', 14, 16)
    doc.setFontSize(10)
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString('en-IN')}`, 14, 24)
    doc.text(`Customer: ${sale.customer || 'Walk-in Customer'}`, 14, 30)
    doc.text(`City: ${sale.city || 'Pune'}`, 14, 36)
    doc.text(`Invoice Ref: ${sale.id}`, 14, 42)

    autoTable(doc, {
      startY: 48,
      head: [['Item', 'Qty', 'Rate', 'Amount']],
      body: [[product?.name || sale.productId, finance.quantity, finance.price.toFixed(2), finance.revenue.toFixed(2)]],
      theme: 'grid',
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Summary', 'Amount']],
      body: [
        ['Subtotal', finance.revenue.toFixed(2)],
        ['Grand Total', finance.revenue.toFixed(2)],
      ],
      theme: 'striped',
    })

    const fileDate = new Date().toISOString().slice(0, 10)
    const fileName = `kulfi_invoice_${fileDate}_${sale.id}.pdf`
    const blob = doc.output('blob')
    announceExport(triggerDownload(blob, fileName))
  }

  const exportDetailedExcel = async () => {
    if (filteredSales.length === 0) return

    const rows = filteredSales.map((sale) => {
      const product = productMap[sale.productId]
      const finance = getSaleFinance(sale, product)
      const margin = getProfitMarginPercent(finance.profit, finance.revenue)
      return [
        sale.date,
        product?.name || sale.productId,
        finance.quantity,
        finance.price,
        finance.revenue,
        finance.cost,
        finance.profit,
        margin.toFixed(2),
        sale.customer || 'Walk-in Customer',
        sale.city || 'Pune',
      ]
    })

    const result = await downloadExcelReport({
      reportTitle: 'Kulfi Detailed Sales Report',
      filePrefix: 'kulfi_detailed_sales',
      headers: ['Date', 'Flavor', 'Qty', 'Rate', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Customer', 'City'],
      rows,
      summaryRows: [
        ['Flavor Filter', flavorFilter === 'all' ? 'All' : productMap[flavorFilter]?.name || flavorFilter],
        ['From Date', fromDate || '-'],
        ['To Date', toDate || '-'],
        ['Orders', summary.orders],
        ['Units', summary.units],
        ['Revenue', summary.revenue.toFixed(2)],
        ['Profit', summary.profit.toFixed(2)],
      ],
      detailSheetName: 'Detailed Sales',
    })

    announceExport(result)
  }

  const exportMonthlyProfitExcel = async () => {
    if (filteredSales.length === 0) return

    const monthly = filteredSales.reduce((acc, sale) => {
      const monthKey = String(sale.date || '').slice(0, 7)
      if (!monthKey) return acc

      const product = productMap[sale.productId]
      const finance = getSaleFinance(sale, product)
      const current = acc.get(monthKey) || { orders: 0, units: 0, revenue: 0, cost: 0, profit: 0 }
      acc.set(monthKey, {
        orders: current.orders + 1,
        units: current.units + finance.quantity,
        revenue: current.revenue + finance.revenue,
        cost: current.cost + finance.cost,
        profit: current.profit + finance.profit,
      })
      return acc
    }, new Map())

    const rows = [...monthly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, val]) => [
        monthKey,
        new Date(`${monthKey}-01`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        val.orders,
        val.units,
        val.revenue,
        val.cost,
        val.profit,
        getProfitMarginPercent(val.profit, val.revenue).toFixed(2),
      ])

    const result = await downloadExcelReport({
      reportTitle: 'Kulfi Monthly Profit Report',
      filePrefix: 'kulfi_monthly_profit',
      headers: ['Month Key', 'Month', 'Orders', 'Units', 'Revenue', 'Cost', 'Profit', 'Margin %'],
      rows,
      summaryRows: [
        ['Months', rows.length],
        ['Flavor Filter', flavorFilter === 'all' ? 'All' : productMap[flavorFilter]?.name || flavorFilter],
      ],
      detailSheetName: 'Monthly Profit',
    })

    announceExport(result)
  }

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Reports Center</h2>
        <p>Generate polished PDF and Excel reports from filtered sales data.</p>
      </div>

      <div className="glass-card filter-bar">
        <label>
          Flavor
          <select value={flavorFilter} onChange={(event) => setFlavorFilter(event.target.value)}>
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
              setPreset('custom')
              setFromDate(event.target.value)
            }}
          />
        </label>

        <label>
          Date to
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setPreset('custom')
              setToDate(event.target.value)
            }}
          />
        </label>

        <div className="filter-actions">
          <button
            type="button"
            className="outline-btn"
            onClick={() => {
              setFlavorFilter('all')
              setFromDate('')
              setToDate('')
              setPreset('all')
            }}
          >
            Clear
          </button>
          <span>
            {filteredSales.length.toLocaleString('en-IN')} rows | {summary.units.toLocaleString('en-IN')} units
          </span>
        </div>
      </div>

      <div className="glass-card dashboard-filter-bar">
        <div className="dashboard-range-buttons" role="group" aria-label="Report date presets">
          {PRESET_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={preset === option ? 'active' : ''}
              onClick={() => applyPreset(option)}
            >
              {option === 'all'
                ? 'All Time'
                : option === 'today'
                  ? 'Today'
                  : option === 'yesterday'
                    ? 'Yesterday'
                    : option === 'week'
                      ? 'This Week'
                      : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      <div className="report-grid">
        <article className="glass-card report-card">
          <h3>PDF Reports</h3>
          <button className="cta-btn cta-full" type="button" onClick={exportInvoicePdf} disabled={filteredSales.length === 0}>
            PDF Invoice
          </button>
          <p className="report-desc">Exports invoice for the latest sale in current filters with customer and item totals.</p>

          <button className="outline-btn cta-full" type="button" onClick={exportDailySummaryPdf} disabled={filteredSales.length === 0}>
            PDF Daily Summary
          </button>
          <p className="report-desc">Includes totals, margin, and top flavor performance table for selected range.</p>
        </article>

        <article className="glass-card report-card">
          <h3>Excel Reports</h3>
          <button className="cta-btn cta-full" type="button" onClick={exportDetailedExcel} disabled={filteredSales.length === 0}>
            Excel Detailed Report
          </button>
          <p className="report-desc">Detailed line items with revenue, cost, profit, margin, customer, and city.</p>

          <button className="outline-btn cta-full" type="button" onClick={exportMonthlyProfitExcel} disabled={filteredSales.length === 0}>
            Excel Monthly Profit
          </button>
          <p className="report-desc">Month-wise revenue, cost, profit, units, orders, and margin percentages.</p>
        </article>
      </div>

      <ToastNotification show={showToast} message={toastMessage} />
    </section>
  )
}

export default Reports
