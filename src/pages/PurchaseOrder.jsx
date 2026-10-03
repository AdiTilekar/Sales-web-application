import { useMemo, useRef, useState } from 'react'
import ToastNotification from '../components/ToastNotification'
import { useSales } from '../context/SalesContext'
import { DEFAULT_SHOP_ID, PRODUCTS, SHOPS } from '../data/products'
import { getLocalISODate } from '../utils/date'
import { handleImageError } from '../utils/image'
import {
  COMPANY_NAME,
  createPOData,
  deletePurchaseOrder,
  downloadPOPDF,
  exportPOExcel,
  formatCurrency,
  formatWhatsAppPOMessage,
  getSavedPurchaseOrders,
  getWhatsAppShareUrl,
  savePurchaseOrder,
  updatePurchaseOrderStatus,
} from '../utils/purchaseOrder'

const QUICK_PRESETS = [5, 10, 20, 50, 100]

const getDefaultUnitCost = (product) => {
  const price = Number(product?.price || 0)
  const profit = Number(product?.profitPerUnit || 0)
  return Math.max(0, price - profit)
}

const PurchaseOrder = () => {
  const { currentShopId, currentShop, changeShop } = useSales()

  const [activeTab, setActiveTab] = useState('new') // 'new' | 'history'
  const [supplierName, setSupplierName] = useState('Shree Ganesh Kulfi Factory')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [poDate, setPoDate] = useState(getLocalISODate())
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Quantities & Custom Editable Prices per product
  const [quantities, setQuantities] = useState({})
  const [customPrices, setCustomPrices] = useState({})

  // Saved Orders for History
  const [savedOrders, setSavedOrders] = useState(getSavedPurchaseOrders)

  // Toast & Undo
  const [toastState, setToastState] = useState({
    show: false,
    message: '',
    actionLabel: null,
    onAction: null,
  })
  const undoOrderRef = useRef(null)
  const undoTimerRef = useRef(null)

  const showToast = (message, actionLabel = null, onAction = null, duration = 3000) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setToastState({ show: true, message, actionLabel, onAction })
    undoTimerRef.current = setTimeout(() => {
      setToastState({ show: false, message: '', actionLabel: null, onAction: null })
    }, duration)
  }

  // Filtered Products for Search
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return PRODUCTS
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term))
  }, [searchTerm])

  // Computed Order Items with Custom Prices
  const orderItems = useMemo(() => {
    const items = []
    PRODUCTS.forEach((product) => {
      const qty = Number(quantities[product.id] || 0)
      if (qty > 0) {
        const defaultCost = getDefaultUnitCost(product)
        const unitPrice = customPrices[product.id] !== undefined ? Number(customPrices[product.id]) : defaultCost
        items.push({
          id: product.id,
          name: product.name,
          image: product.image,
          quantity: qty,
          unitPrice,
          defaultCost,
          lineTotal: qty * unitPrice,
        })
      }
    })
    return items
  }, [customPrices, quantities])

  const totals = useMemo(() => {
    return orderItems.reduce(
      (acc, item) => {
        acc.totalUnits += item.quantity
        acc.totalAmount += item.lineTotal
        return acc
      },
      { totalUnits: 0, totalAmount: 0 },
    )
  }, [orderItems])

  // Handlers for Quantities
  const handleQuantityChange = (productId, rawVal) => {
    const num = Math.max(0, parseInt(rawVal, 10) || 0)
    setQuantities((prev) => {
      const next = { ...prev }
      if (num === 0) {
        delete next[productId]
      } else {
        next[productId] = num
      }
      return next
    })
  }

  const handleIncrement = (productId, step = 1) => {
    setQuantities((prev) => {
      const current = Number(prev[productId] || 0)
      const nextVal = Math.max(0, current + step)
      const updated = { ...prev }
      if (nextVal === 0) {
        delete updated[productId]
      } else {
        updated[productId] = nextVal
      }
      return updated
    })
  }

  // Handlers for Custom Price Edits
  const handlePriceChange = (productId, rawPrice) => {
    const priceNum = rawPrice === '' ? '' : Math.max(0, Number(rawPrice))
    setCustomPrices((prev) => ({
      ...prev,
      [productId]: priceNum,
    }))
  }

  const handleResetPrice = (productId) => {
    setCustomPrices((prev) => {
      const updated = { ...prev }
      delete updated[productId]
      return updated
    })
  }

  const handleClearOrder = () => {
    if (orderItems.length === 0) return
    const confirmed = window.confirm('Clear all quantities and price edits in this purchase order?')
    if (!confirmed) return
    setQuantities({})
    setCustomPrices({})
    setNotes('')
    showToast('Purchase order form cleared.')
  }

  // Build PO Object
  const createPOObject = (status = 'Created') =>
    createPOData({
      orderCount: savedOrders.length,
      shopId: currentShopId,
      branchName: currentShop?.name || DEFAULT_SHOP_ID,
      poDate,
      expectedDelivery,
      supplierName,
      supplierPhone,
      notes,
      items: orderItems,
      totalUnits: totals.totalUnits,
      totalAmount: totals.totalAmount,
      status,
    })

  // Action: Send via WhatsApp
  const handleSendWhatsApp = () => {
    if (orderItems.length === 0) {
      window.alert('Please add at least one kulfi flavor quantity to create a Purchase Order.')
      return
    }

    const po = createPOObject('Sent via WhatsApp')
    const updated = savePurchaseOrder(po)
    setSavedOrders(updated)

    const msg = formatWhatsAppPOMessage(po)
    const url = getWhatsAppShareUrl(supplierPhone, msg)

    window.open(url, '_blank', 'noopener,noreferrer')
    showToast(`✓ Purchase Order ${po.poNumber} sent to WhatsApp & saved!`)
  }

  // Action: Download PDF
  const handleDownloadPDF = async () => {
    if (orderItems.length === 0) {
      window.alert('Please add at least one kulfi flavor quantity before downloading PDF.')
      return
    }

    const po = createPOObject('PDF Generated')
    const updated = savePurchaseOrder(po)
    setSavedOrders(updated)

    await downloadPOPDF(po)
    showToast(`✓ Signed PDF for ${po.poNumber} downloaded!`)
  }

  // Action: Export Excel
  const handleExportExcel = () => {
    if (orderItems.length === 0) {
      window.alert('Please add at least one kulfi flavor quantity before exporting Excel.')
      return
    }

    const po = createPOObject('Excel Exported')
    const updated = savePurchaseOrder(po)
    setSavedOrders(updated)

    exportPOExcel(po)
    showToast(`✓ Excel sheet for ${po.poNumber} exported!`)
  }

  // Action: Copy Text
  const handleCopyText = async () => {
    if (orderItems.length === 0) {
      window.alert('Please add at least one kulfi flavor quantity before copying order text.')
      return
    }

    const po = createPOObject('Copied')
    const updated = savePurchaseOrder(po)
    setSavedOrders(updated)

    const msg = formatWhatsAppPOMessage(po)

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(msg)
        showToast('✓ Order details copied to clipboard & saved!')
      } else {
        showToast(`✓ Order ${po.poNumber} saved to archive!`)
      }
    } catch {
      showToast(`✓ Order ${po.poNumber} saved to archive!`)
    }
  }

  // Action: Save to Archive
  const handleSaveOrder = () => {
    if (orderItems.length === 0) {
      window.alert('Please add at least one kulfi flavor quantity before saving.')
      return
    }

    const po = createPOObject('Saved')
    const updated = savePurchaseOrder(po)
    setSavedOrders(updated)
    showToast(`✓ Purchase Order ${po.poNumber} saved to archive!`)
  }

  // History Actions
  const handleToggleStatus = (poId, currentStatus) => {
    const nextStatus =
      currentStatus === 'Delivered'
        ? 'Pending'
        : currentStatus === 'Sent via WhatsApp'
          ? 'Delivered'
          : currentStatus === 'Pending'
            ? 'Delivered'
            : 'Delivered'
    const updated = updatePurchaseOrderStatus(poId, nextStatus)
    setSavedOrders(updated)
    showToast(`Status updated to "${nextStatus}"`)
  }

  const handleResendWhatsApp = (po) => {
    const msg = formatWhatsAppPOMessage(po)
    const url = getWhatsAppShareUrl(po.supplierPhone, msg)
    window.open(url, '_blank', 'noopener,noreferrer')
    showToast(`Re-sending ${po.poNumber} to WhatsApp...`)
  }

  const handleDeleteHistoryPO = (po) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)

    undoOrderRef.current = po
    const updated = deletePurchaseOrder(po.id)
    setSavedOrders(updated)

    showToast(
      `Deleted ${po.poNumber} (${po.totalUnits} units · ${formatCurrency(po.totalAmount)})`,
      'UNDO',
      () => {
        if (undoOrderRef.current) {
          const restored = savePurchaseOrder(undoOrderRef.current)
          setSavedOrders(restored)
          undoOrderRef.current = null
          showToast('✓ Purchase order restored!')
        }
      },
      5000,
    )
  }

  return (
    <section className="page page-enter po-page">
      <div className="page-header">
        <div className="po-header-title-row">
          <div>
            <h2>Purchase Order</h2>
            <p>Create, customize purchase rates, digitally sign, and directly dispatch kulfi stock orders.</p>
          </div>
          <span className="po-signature-pill" title="Official Authorized Signatory">
            ✍️ {COMPANY_NAME}
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="view-mode-switch po-tab-switch" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'new'}
          className={activeTab === 'new' ? 'active' : ''}
          onClick={() => setActiveTab('new')}
        >
          📦 New Purchase Order {orderItems.length > 0 ? `(${totals.totalUnits} units)` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📜 Order History ({savedOrders.length})
        </button>
      </div>

      {activeTab === 'new' ? (
        <>
          {/* Order Metadata & Destination Settings */}
          <div className="glass-card po-meta-panel">
            <div className="po-meta-grid">
              <label>
                Ordering For Branch
                <select
                  value={currentShopId}
                  onChange={(e) => changeShop(e.target.value)}
                  className="po-select"
                >
                  {SHOPS.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Supplier / Factory Name
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Shree Ganesh Kulfi Factory"
                />
              </label>

              <label>
                Supplier WhatsApp Number
                <input
                  type="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="e.g. 9876543210 (Optional for direct send)"
                />
              </label>

              <label>
                PO Order Date
                <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
              </label>

              <label>
                Expected Delivery Date
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </label>

              <label className="po-notes-label">
                Order Notes / Special Instructions
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Morning dispatch, extra dry ice..."
                />
              </label>
            </div>
          </div>

          {/* Flavor Search Bar */}
          <div className="glass-card po-filter-bar">
            <div className="po-search-wrap">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search flavors to order..."
                className="po-search-input"
              />
              {searchTerm ? (
                <button type="button" className="outline-btn po-search-clear" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              ) : null}
            </div>

            <div className="po-filter-stats">
              <span>{PRODUCTS.length} Flavors Available</span>
              {orderItems.length > 0 ? (
                <button type="button" className="outline-btn po-clear-btn" onClick={handleClearOrder}>
                  Clear All ({orderItems.length})
                </button>
              ) : null}
            </div>
          </div>

          {/* Flavors Ordering Matrix */}
          <div className="po-flavor-grid" aria-label="Kulfi flavor ordering grid">
            {filteredProducts.map((product) => {
              const defaultCost = getDefaultUnitCost(product)
              const customPrice = customPrices[product.id]
              const activePrice = customPrice !== undefined ? customPrice : defaultCost
              const qty = Number(quantities[product.id] || 0)
              const lineTotal = qty * (Number(activePrice) || 0)
              const isPriceEdited = customPrice !== undefined && customPrice !== defaultCost

              return (
                <div
                  key={product.id}
                  className={`glass-card po-flavor-card ${qty > 0 ? 'po-flavor-card-active' : ''}`}
                >
                  <div className="po-card-top">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="po-card-img"
                      onError={handleImageError}
                      width="64"
                      height="64"
                      decoding="async"
                    />
                    <div className="po-card-info">
                      <strong>{product.name}</strong>
                      <div className="po-price-editor-row">
                        <span className="po-price-label">Cost/Unit:</span>
                        <div className="po-price-input-wrap">
                          <span className="po-currency-symbol">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={activePrice}
                            onChange={(e) => handlePriceChange(product.id, e.target.value)}
                            className={`po-price-input ${isPriceEdited ? 'po-price-edited' : ''}`}
                            title="Personally edit purchase price per unit"
                          />
                        </div>
                        {isPriceEdited ? (
                          <button
                            type="button"
                            className="po-price-reset-btn"
                            onClick={() => handleResetPrice(product.id)}
                            title={`Reset to base cost ₹${defaultCost}`}
                          >
                            ↺ Base ₹{defaultCost}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Direct Input */}
                  <div className="po-card-qty-row">
                    <button
                      type="button"
                      className="po-stepper-btn"
                      onClick={() => handleIncrement(product.id, -1)}
                      aria-label={`Decrease ${product.name} quantity`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty || ''}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      placeholder="0"
                      className="po-qty-input"
                      aria-label={`${product.name} quantity`}
                    />
                    <button
                      type="button"
                      className="po-stepper-btn"
                      onClick={() => handleIncrement(product.id, 1)}
                      aria-label={`Increase ${product.name} quantity`}
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Increment Presets */}
                  <div className="po-presets-row" role="group" aria-label="Quick quantity add">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="po-preset-btn"
                        onClick={() => handleIncrement(product.id, preset)}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>

                  {/* Line Total */}
                  {qty > 0 ? (
                    <div className="po-card-line-total">
                      <span>Line Total ({qty} × ₹{activePrice}):</span>
                      <strong>{formatCurrency(lineTotal)}</strong>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Live Order Summary & Digital Signature Certificate Box */}
          <div className="glass-card po-summary-card">
            <div className="po-summary-header">
              <h3>Purchase Order Summary</h3>
              <span className={`branch-badge branch-badge-${currentShopId}`}>
                {currentShop?.name || 'Branch'}
              </span>
            </div>

            <div className="po-summary-metrics">
              <div className="po-metric">
                <small>Flavors Selected</small>
                <strong>{orderItems.length} of {PRODUCTS.length}</strong>
              </div>
              <div className="po-metric">
                <small>Total Units to Order</small>
                <strong className="po-highlight">{totals.totalUnits.toLocaleString('en-IN')} units</strong>
              </div>
              <div className="po-metric">
                <small>Total Estimated Cost</small>
                <strong className="po-highlight-gold">{formatCurrency(totals.totalAmount)}</strong>
              </div>
            </div>

            {/* Digital Signature Certification */}
            <div className="po-digital-signature-box">
              <div className="po-signature-icon">✍️</div>
              <div className="po-signature-text">
                <span className="po-signature-status">✓ Digital Signature Verification</span>
                <strong>Authorized by {COMPANY_NAME}</strong>
                <p>This Purchase Order will be digitally stamped and certified with all custom rate adjustments.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="po-actions-grid">
              <button
                type="button"
                className="cta-btn po-whatsapp-btn"
                onClick={handleSendWhatsApp}
                disabled={orderItems.length === 0}
              >
                <span className="po-btn-icon">💬</span>
                <span>Send via WhatsApp</span>
                <span className="po-btn-arrow">→</span>
              </button>

              <button
                type="button"
                className="cta-btn po-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={orderItems.length === 0}
              >
                <span className="po-btn-icon">📄</span>
                <span>Download Signed PDF</span>
              </button>

              <button
                type="button"
                className="outline-btn"
                onClick={handleExportExcel}
                disabled={orderItems.length === 0}
              >
                📊 Export Excel
              </button>

              <button
                type="button"
                className="outline-btn"
                onClick={handleCopyText}
                disabled={orderItems.length === 0}
              >
                📋 Copy Order Text
              </button>

              <button
                type="button"
                className="outline-btn po-save-btn"
                onClick={handleSaveOrder}
                disabled={orderItems.length === 0}
              >
                💾 Save to Archive
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Order History Tab */
        <div className="po-history-section">
          <div className="po-history-header">
            <h3>Saved Purchase Orders</h3>
            <p>Archive of generated and dispatched factory purchase orders.</p>
          </div>

          {savedOrders.length === 0 ? (
            <div className="glass-card po-empty-card">
              <p>📦 No purchase orders created yet.</p>
              <button type="button" className="cta-btn" onClick={() => setActiveTab('new')}>
                Create Your First Purchase Order
              </button>
            </div>
          ) : (
            <div className="po-history-list">
              {savedOrders.map((po) => (
                <article key={po.id} className="glass-card po-history-card">
                  <div className="po-history-card-top">
                    <div>
                      <div className="po-history-title-row">
                        <strong>{po.poNumber}</strong>
                        <span className={`branch-badge branch-badge-${po.shopId || DEFAULT_SHOP_ID}`}>
                          {po.branchName}
                        </span>
                        <span className={`po-status-badge po-status-${(po.status || 'Created').toLowerCase().replace(/\s+/g, '-')}`}>
                          {po.status || 'Created'}
                        </span>
                      </div>
                      <p className="po-history-date">
                        Ordered: {new Date(po.date).toLocaleDateString('en-IN')}
                        {po.expectedDelivery ? ` • Delivery: ${new Date(po.expectedDelivery).toLocaleDateString('en-IN')}` : ''}
                      </p>
                    </div>

                    <div className="po-history-card-actions">
                      <button
                        type="button"
                        className="outline-btn po-status-toggle-btn"
                        onClick={() => handleToggleStatus(po.id, po.status)}
                        title="Toggle order delivery status"
                      >
                        {po.status === 'Delivered' ? 'Mark Pending' : 'Mark Delivered ✓'}
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteHistoryPO(po)}
                        title="Delete PO record"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="po-history-items-pill-row">
                    {po.items.map((item) => (
                      <span key={item.id} className="po-history-item-chip">
                        {item.name} × <strong>{item.quantity}</strong> ({formatCurrency(item.lineTotal || item.quantity * item.unitPrice)})
                      </span>
                    ))}
                  </div>

                  <div className="po-history-card-footer">
                    <div className="po-history-totals">
                      <span>Total: <strong>{po.totalUnits.toLocaleString('en-IN')} units</strong></span>
                      <span>Amount: <strong className="po-gold-text">{formatCurrency(po.totalAmount)}</strong></span>
                      <small>✍️ {po.signedBy || COMPANY_NAME}</small>
                    </div>

                    <div className="po-history-quick-btns">
                      <button
                        type="button"
                        className="cta-btn po-sm-btn"
                        onClick={() => handleResendWhatsApp(po)}
                        title="Send / Re-send to WhatsApp"
                      >
                        💬 WhatsApp
                      </button>
                      <button
                        type="button"
                        className="outline-btn po-sm-btn"
                        onClick={() => downloadPOPDF(po)}
                        title="Download PDF slip"
                      >
                        📄 PDF
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Mobile Summary Bar for New Tab */}
      {activeTab === 'new' && orderItems.length > 0 ? (
        <div className="po-mobile-floating-bar" role="region" aria-label="Purchase order summary">
          <div className="po-mobile-bar-info">
            <strong>{totals.totalUnits.toLocaleString('en-IN')} units</strong>
            <span>{formatCurrency(totals.totalAmount)}</span>
          </div>
          <button type="button" className="cta-btn po-mobile-wa-btn" onClick={handleSendWhatsApp}>
            <span>💬 Send WhatsApp</span>
          </button>
        </div>
      ) : null}

      <ToastNotification
        show={toastState.show}
        message={toastState.message}
        actionLabel={toastState.actionLabel}
        onAction={toastState.onAction}
      />
    </section>
  )
}

export default PurchaseOrder
