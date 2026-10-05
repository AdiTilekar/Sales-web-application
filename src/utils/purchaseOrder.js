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
  const pageHeight = doc.internal.pageSize.getHeight()
  const dateStr = new Date(po.date || getLocalISODate()).toLocaleDateString('en-IN')
  const deliveryStr = po.expectedDelivery
    ? new Date(po.expectedDelivery).toLocaleDateString('en-IN')
    : 'Immediate / Next Batch'

  // 1. Header Banner
  doc.setFillColor(15, 23, 42) // Navy #0f172a
  doc.rect(0, 0, pageWidth, 36, 'F')

  // Top Left Brand & Title
  doc.setTextColor(242, 166, 35) // Gold #f2a623
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('SHREE GANESH KULFI', 14, 14)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Purchase Order — ${po.poNumber}`, 14, 22)

  doc.setTextColor(148, 163, 184) // Slate 400
  doc.setFontSize(8.5)
  doc.text(`Issued by: ${COMPANY_NAME}`, 14, 29)

  // Top Right Info
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(`Date: ${dateStr}`, pageWidth - 14, 14, { align: 'right' })

  doc.setTextColor(242, 166, 35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Branch: ${po.branchName}`, pageWidth - 14, 22, { align: 'right' })

  doc.setTextColor(226, 232, 240)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(`Expected Delivery: ${deliveryStr}`, pageWidth - 14, 29, { align: 'right' })

  // 2. Supplier / Factory Information Panel
  const suppY = 42
  const hasPhone = Boolean(po.supplierPhone)
  const hasNotes = Boolean(po.notes)
  let suppBoxHeight = 16
  if (hasPhone && hasNotes) suppBoxHeight = 24
  else if (hasPhone || hasNotes) suppBoxHeight = 20

  doc.setFillColor(248, 250, 252) // #f8fafc
  doc.setDrawColor(226, 232, 240) // #e2e8f0
  doc.setLineWidth(0.3)
  doc.roundedRect(14, suppY, pageWidth - 28, suppBoxHeight, 2, 2, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('SUPPLIER / FACTORY INFORMATION:', 18, suppY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)
  doc.text(`Name: ${po.supplierName || 'Shree Ganesh Kulfi Factory'}`, 18, suppY + 11)

  if (hasPhone) {
    doc.text(`Contact: ${po.supplierPhone}`, 18, suppY + 16.5)
  }

  if (hasNotes) {
    const notesY = hasPhone ? suppY + 21.5 : suppY + 16.5
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 116, 139)
    doc.text(`Notes: ${po.notes}`, 18, notesY)
  }

  // 3. Table Rows
  const tableRows = po.items.map((item, index) => [
    index + 1,
    item.name,
    Number(item.quantity).toLocaleString('en-IN'),
    Number(item.unitPrice).toLocaleString('en-IN'),
    Number(item.quantity * item.unitPrice).toLocaleString('en-IN'),
  ])

  const startYPos = suppY + suppBoxHeight + 5

  autoTable(doc, {
    startY: startYPos,
    head: [
      [
        { content: '#', styles: { halign: 'center' } },
        { content: 'Flavor / Item Description', styles: { halign: 'left' } },
        { content: 'Quantity (Units)', styles: { halign: 'right' } },
        { content: 'Unit Rate (Rs.)', styles: { halign: 'right' } },
        { content: 'Total Amount (Rs.)', styles: { halign: 'right' } },
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [242, 166, 35],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 34, halign: 'right' },
    },
    foot: [
      [
        { content: 'Grand Totals', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `${Number(po.totalUnits).toLocaleString('en-IN')} units`, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '-', styles: { halign: 'center' } },
        { content: `Rs. ${Number(po.totalAmount).toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold' } },
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    margin: { left: 14, right: 14 },
  })

  // 4. Digital Signature Box
  let finalY = doc.lastAutoTable.finalY + 8
  const sigBoxHeight = 28
  const sigBoxWidth = 78
  const sigBoxX = pageWidth - 14 - sigBoxWidth

  if (finalY + sigBoxHeight > pageHeight - 12) {
    doc.addPage()
    finalY = 16
  }

  doc.setDrawColor(242, 166, 35) // Gold border
  doc.setLineWidth(0.4)
  doc.setFillColor(254, 252, 232) // Amber light
  doc.roundedRect(sigBoxX, finalY, sigBoxWidth, sigBoxHeight, 2, 2, 'FD')

  doc.setTextColor(180, 83, 9) // Amber 700
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('DIGITAL SIGNATURE VERIFIED', sigBoxX + 4, finalY + 6)

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Authorized Signatory:', sigBoxX + 4, finalY + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(COMPANY_NAME, sigBoxX + 4, finalY + 18)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`Signed on ${dateStr} via Kulfi POS`, sigBoxX + 4, finalY + 23.5)

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
