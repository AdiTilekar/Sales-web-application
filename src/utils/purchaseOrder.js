import { getLocalISODate } from './date'

export const COMPANY_NAME = "TILEKAR AND SON'S Pvt.Ltd."
export const PO_STORAGE_KEY = 'kulfi-purchase-orders-v1'

export const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`

export const generatePONumber = (count = 0) => {
  const today = getLocalISODate().replace(/-/g, '')
  const seq = String(count + 1).padStart(2, '0')
  return `PO-${today}-${seq}`
}

export const createPOData = ({
  orderCount = 0,
  shopId,
  branchName,
  poDate,
  expectedDelivery,
  supplierName,
  supplierPhone,
  notes,
  items,
  totalUnits,
  totalAmount,
  status = 'Created',
}) => {
  const poNumber = generatePONumber(orderCount)
  return {
    id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    poNumber,
    shopId,
    branchName,
    companyName: COMPANY_NAME,
    date: poDate || getLocalISODate(),
    expectedDelivery,
    supplierName: supplierName?.trim() || 'Factory Warehouse',
    supplierPhone: supplierPhone?.trim() || '',
    notes: notes?.trim() || '',
    items: (items || []).map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    totalUnits: totalUnits || 0,
    totalAmount: totalAmount || 0,
    status,
    signedBy: COMPANY_NAME,
    createdAt: new Date().toISOString(),
  }
}

export const getSavedPurchaseOrders = () => {
  try {
    const raw = localStorage.getItem(PO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const savePurchaseOrder = (order) => {
  try {
    const orders = getSavedPurchaseOrders()
    const updated = [order, ...orders.filter((o) => o.id !== order.id)]
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save purchase order:', err)
    return getSavedPurchaseOrders()
  }
}

export const deletePurchaseOrder = (id) => {
  try {
    const orders = getSavedPurchaseOrders()
    const updated = orders.filter((o) => o.id !== id)
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to delete purchase order:', err)
    return getSavedPurchaseOrders()
  }
}

export const updatePurchaseOrderStatus = (id, status) => {
  try {
    const orders = getSavedPurchaseOrders()
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o))
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to update PO status:', err)
    return getSavedPurchaseOrders()
  }
}

export const formatWhatsAppPOMessage = (po) => {
  const dateStr = new Date(po.date || getLocalISODate()).toLocaleDateString('en-IN')
  const deliveryStr = po.expectedDelivery
    ? new Date(po.expectedDelivery).toLocaleDateString('en-IN')
    : 'Immediate / Next Batch'

  let msg = `*🍦 SHREE GANESH KULFI — PURCHASE ORDER*\n`
  msg += `*${COMPANY_NAME}*\n`
  msg += `─────────────────────────\n`
  msg += `📄 *PO Number:* ${po.poNumber}\n`
  msg += `🏢 *Branch:* ${po.branchName}\n`
  msg += `📅 *Order Date:* ${dateStr}\n`
  msg += `🚚 *Expected Delivery:* ${deliveryStr}\n`
  if (po.supplierName) msg += `🏭 *Supplier / Factory:* ${po.supplierName}\n`
  msg += `─────────────────────────\n`
  msg += `*📦 ORDERED ITEMS:*\n`

  po.items.forEach((item, index) => {
    const rate = formatCurrency(item.unitPrice)
    const lineTotal = formatCurrency(item.quantity * item.unitPrice)
    msg += `${index + 1}. *${item.name}*: ${item.quantity} units @ ${rate} = *${lineTotal}*\n`
  })

  msg += `─────────────────────────\n`
  msg += `*📊 TOTAL QUANTITY:* *${po.totalUnits.toLocaleString('en-IN')} units*\n`
  msg += `*💰 TOTAL ESTIMATED AMOUNT:* *${formatCurrency(po.totalAmount)}*\n`

  if (po.notes && po.notes.trim()) {
    msg += `📝 *Notes / Instructions:* ${po.notes.trim()}\n`
  }

  msg += `─────────────────────────\n`
  msg += `✍️ *Digitally Signed & Authorized by:*\n`
  msg += `*${COMPANY_NAME}*\n`
  msg += `_Generated via Shree Ganesh Kulfi POS System_`

  return msg
}

export const getWhatsAppShareUrl = (phone, message) => {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '')
  const encoded = encodeURIComponent(message)
  if (cleanPhone.length >= 10) {
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encoded}`
  }
  return `https://api.whatsapp.com/send?text=${encoded}`
}

export const downloadPOPDF = async (po) => {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default || autoTableModule

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const dateStr = new Date(po.date || getLocalISODate()).toLocaleDateString('en-IN')

  // Header Banner
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 38, 'F')

  doc.setTextColor(242, 166, 35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('SHREE GANESH KULFI', 14, 16)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Purchase Order — ${po.poNumber}`, 14, 25)
  doc.setFontSize(9)
  doc.text(`Issued by: ${COMPANY_NAME}`, 14, 32)

  // Top Right Info Box
  doc.setFontSize(9)
  doc.text(`Date: ${dateStr}`, pageWidth - 14, 18, { align: 'right' })
  doc.text(`Branch: ${po.branchName}`, pageWidth - 14, 25, { align: 'right' })
  if (po.expectedDelivery) {
    doc.text(`Delivery: ${new Date(po.expectedDelivery).toLocaleDateString('en-IN')}`, pageWidth - 14, 32, { align: 'right' })
  }

  // Supplier Details
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Supplier / Factory Information:', 14, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Name: ${po.supplierName || 'Factory Warehouse'}`, 14, 55)
  if (po.supplierPhone) {
    doc.text(`Contact: ${po.supplierPhone}`, 14, 61)
  }
  if (po.notes) {
    doc.text(`Notes: ${po.notes}`, 14, po.supplierPhone ? 67 : 61)
  }

  // Table rows
  const tableRows = po.items.map((item, index) => [
    index + 1,
    item.name,
    item.quantity.toLocaleString('en-IN'),
    formatCurrency(item.unitPrice),
    formatCurrency(item.quantity * item.unitPrice),
  ])

  const startYPos = po.notes && po.supplierPhone ? 74 : 68

  autoTable(doc, {
    startY: startYPos,
    head: [['#', 'Flavor / Item Description', 'Quantity (Units)', 'Unit Rate', 'Total Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [242, 166, 35],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    foot: [
      [
        '',
        'Grand Totals',
        `${po.totalUnits.toLocaleString('en-IN')} units`,
        '-',
        formatCurrency(po.totalAmount),
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'right',
    },
  })

  const finalY = doc.lastAutoTable.finalY + 12

  // Digital Signature Box
  doc.setDrawColor(242, 166, 35)
  doc.setLineWidth(0.5)
  doc.setFillColor(254, 252, 232)
  doc.roundedRect(pageWidth - 90, finalY, 76, 32, 2, 2, 'FD')

  doc.setTextColor(180, 83, 9)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('✓ DIGITAL SIGNATURE VERIFIED', pageWidth - 86, finalY + 7)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(9)
  doc.text('Authorized Signatory:', pageWidth - 86, finalY + 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text(COMPANY_NAME, pageWidth - 86, finalY + 21)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`Signed on ${dateStr} via Kulfi POS`, pageWidth - 86, finalY + 27)

  // Save PDF
  doc.save(`${po.poNumber.toLowerCase()}_${po.branchName.replace(/\s+/g, '_').toLowerCase()}.pdf`)
}

export const exportPOExcel = async (po) => {
  const XLSX = await import('xlsx')
  const dateStr = new Date(po.date || getLocalISODate()).toLocaleDateString('en-IN')

  const metaRows = [
    ['PURCHASE ORDER', ''],
    ['PO Number', po.poNumber],
    ['Company / Signatory', COMPANY_NAME],
    ['Branch', po.branchName],
    ['Order Date', dateStr],
    ['Expected Delivery', po.expectedDelivery || 'Immediate'],
    ['Supplier Name', po.supplierName || '-'],
    ['Supplier Contact', po.supplierPhone || '-'],
    ['Notes', po.notes || '-'],
    ['', ''],
  ]

  const itemHeaders = ['#', 'Flavor Name', 'Quantity (Units)', 'Unit Rate (₹)', 'Line Total (₹)']
  const itemRows = po.items.map((item, idx) => [
    idx + 1,
    item.name,
    item.quantity,
    item.unitPrice,
    item.quantity * item.unitPrice,
  ])

  const totalRow = ['', 'TOTAL', po.totalUnits, '', po.totalAmount]
  const signatureRow = ['', '', '', 'Digitally Signed by:', COMPANY_NAME]

  const fullData = [...metaRows, itemHeaders, ...itemRows, totalRow, ['', ''], signatureRow]

  const worksheet = XLSX.utils.aoa_to_sheet(fullData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Order')

  XLSX.writeFile(workbook, `${po.poNumber.toLowerCase()}_order.xlsx`)
}
