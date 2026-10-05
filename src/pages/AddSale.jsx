import { useEffect, useMemo, useRef, useState } from 'react'
import FlavorCard from '../components/FlavorCard'
import ToastNotification from '../components/ToastNotification'
import { useSales } from '../context/SalesContext'
import { DEFAULT_SHOP_ID } from '../data/products'
import { getLocalISODate, toLocalDateKey } from '../utils/date'
import { handleImageError } from '../utils/image'

const AddSale = () => {
  const { products, allSales, addSale, addSalesBatch, currentShop, currentShopId, cartItems, setCartItems, clearCart } = useSales()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [customer, setCustomer] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState(getLocalISODate())
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('✓ Sale recorded!')
  const [searchInput, setSearchInput] = useState('')
  const [entryMode, setEntryMode] = useState('card')
  const [listQuantities, setListQuantities] = useState({})
  const [editingListProductId, setEditingListProductId] = useState('')
  const [editingListQuantity, setEditingListQuantity] = useState('')
  const [isInPageCheckoutVisible, setIsInPageCheckoutVisible] = useState(false)
  const inPageCheckoutRef = useRef(null)
  const lastKnownTodayRef = useRef(getLocalISODate())
  const touchStartYRef = useRef(0)

  const selectedProduct = products.find((product) => product.id === selectedProductId)

  const filteredProducts = useMemo(() => {
    if (!searchInput.trim()) return products
    const normalized = searchInput.trim().toLowerCase()
    return products.filter((product) => product.name.toLowerCase().includes(normalized))
  }, [products, searchInput])

  const demandByProductId = useMemo(() => {
    return allSales.reduce((acc, sale) => {
      const quantity = Number(sale.quantity || 0)
      if (!quantity) return acc
      acc[sale.productId] = (acc[sale.productId] || 0) + quantity
      return acc
    }, {})
  }, [allSales])

  const quickListProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const demandDiff = (demandByProductId[b.id] || 0) - (demandByProductId[a.id] || 0)
      if (demandDiff !== 0) return demandDiff
      return a.name.localeCompare(b.name)
    })
  }, [filteredProducts, demandByProductId])

  const cartDetails = useMemo(() => {
    const detailedItems = cartItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return null
        const unitPrice = Number(item.unitPrice ?? product.price)
        return {
          ...item,
          product,
          unitPrice,
          amount: item.quantity * unitPrice,
        }
      })
      .filter(Boolean)

    const totalAmount = detailedItems.reduce((sum, item) => sum + item.amount, 0)
    const totalUnits = detailedItems.reduce((sum, item) => sum + item.quantity, 0)

    return { detailedItems, totalAmount, totalUnits }
  }, [cartItems, products])

  const quickListSummary = useMemo(() => {
    const selectedRows = quickListProducts
      .map((product) => {
        const qty = Number(listQuantities[product.id] || 0)
        if (qty <= 0) return null
        return {
          product,
          quantity: qty,
          amount: qty * product.price,
        }
      })
      .filter(Boolean)

    const selectedFlavors = selectedRows.length
    const selectedUnits = selectedRows.reduce((sum, item) => sum + item.quantity, 0)
    const selectedAmount = selectedRows.reduce((sum, item) => sum + item.amount, 0)

    return { selectedRows, selectedFlavors, selectedUnits, selectedAmount }
  }, [quickListProducts, listQuantities])

  useEffect(() => {
    if (!showToast) return undefined
    const timer = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(timer)
  }, [showToast])

  useEffect(() => {
    if (!isSheetOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isSheetOpen])

  useEffect(() => {
    const target = inPageCheckoutRef.current
    if (!target) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInPageCheckoutVisible(entry.isIntersecting)
      },
      { threshold: 0.15 },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [cartDetails.detailedItems.length])

  useEffect(() => {
    const timer = setInterval(() => {
      const latestToday = getLocalISODate()
      if (latestToday === lastKnownTodayRef.current) return

      setDate((previousDate) =>
        previousDate === lastKnownTodayRef.current ? latestToday : previousDate,
      )
      lastKnownTodayRef.current = latestToday
    }, 60_000)

    return () => clearInterval(timer)
  }, [])

  const openSheet = (productId) => {
    setSelectedProductId(productId)
    setQuantity(1)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setSelectedProductId('')
    setQuantity(1)
  }

  const handleSheetTouchStart = (event) => {
    touchStartYRef.current = event.touches?.[0]?.clientY || 0
  }

  const handleSheetTouchEnd = (event) => {
    const endY = event.changedTouches?.[0]?.clientY || 0
    const deltaY = endY - touchStartYRef.current
    if (deltaY > 60) {
      closeSheet()
    }
  }

  const updateQuantity = (nextValue) => {
    if (nextValue === '' || nextValue == null) {
      setQuantity('')
      return
    }
    const normalized = Number(nextValue)
    if (Number.isNaN(normalized) || normalized < 1) return
    setQuantity(normalized)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const effectiveQty = Number(quantity) || 1
    if (!selectedProductId || effectiveQty <= 0) return
    const effectiveDate = toLocalDateKey(date) || getLocalISODate()

    const isSaved = await addSale({
      productId: selectedProductId,
      quantity: effectiveQty,
      customer: customer.trim() || 'Walk-in Customer',
      city: city.trim() || 'Pune',
      date: effectiveDate,
    })

    if (!isSaved) {
      setToastMessage('Could not save sale. Check connection and try again.')
      setShowToast(true)
      return
    }

    setQuantity(1)
    setCustomer('')
    setCity('')
    setDate(getLocalISODate())
    closeSheet()
    setToastMessage('✓ Sale recorded!')
    setShowToast(true)
  }

  const handleAddToCart = () => {
    const effectiveQty = Number(quantity) || 1
    if (!selectedProductId || effectiveQty <= 0) return
    const product = products.find((p) => p.id === selectedProductId)
    const unitPrice = product ? product.price : 0

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === selectedProductId)
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProductId
            ? { ...item, quantity: item.quantity + effectiveQty, unitPrice }
            : item,
        )
      }

      return [
        ...prev,
        {
          productId: selectedProductId,
          quantity: effectiveQty,
          unitPrice,
          shopId: currentShopId,
          shopName: currentShop?.name || 'Branch',
        },
      ]
    })

    setToastMessage('Item added to cart')
    setShowToast(true)
    closeSheet()
  }

  const removeCartItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const normalizeListQty = (value) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return 0
    return Math.max(0, Math.trunc(parsed))
  }

  const updateListQty = (productId, value) => {
    const normalized = normalizeListQty(value)
    setListQuantities((prev) => ({
      ...prev,
      [productId]: normalized,
    }))
  }

  const increaseListQty = (productId) => {
    updateListQty(productId, Number(listQuantities[productId] || 0) + 1)
  }

  const decreaseListQty = (productId) => {
    updateListQty(productId, Number(listQuantities[productId] || 0) - 1)
  }

  const addListSelectionToCart = () => {
    if (quickListSummary.selectedRows.length === 0) return

    setCartItems((prev) => {
      const next = [...prev]
      quickListSummary.selectedRows.forEach((row) => {
        const existingIndex = next.findIndex((item) => item.productId === row.product.id)
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + row.quantity,
            unitPrice: row.product.price,
          }
          return
        }
        next.push({
          productId: row.product.id,
          quantity: row.quantity,
          unitPrice: row.product.price,
          shopId: currentShopId,
          shopName: currentShop?.name || 'Branch',
        })
      })
      return next
    })

    setToastMessage('Selected quick-list items added to cart')
    setShowToast(true)
    setListQuantities({})
  }

  const clearListSelection = () => {
    setListQuantities({})
    setEditingListProductId('')
    setEditingListQuantity('')
  }

  const startListQtyEdit = (productId) => {
    setEditingListProductId(productId)
    setEditingListQuantity(String(Number(listQuantities[productId] || 0)))
  }

  const applyListQtyEdit = (productId) => {
    if (editingListProductId !== productId) return
    updateListQty(productId, editingListQuantity)
    setEditingListProductId('')
    setEditingListQuantity('')
  }

  const cancelListQtyEdit = () => {
    setEditingListProductId('')
    setEditingListQuantity('')
  }

  const updateEditingListQuantity = (value) => {
    if (value === '') {
      setEditingListQuantity('')
      return
    }
    if (!/^\d+$/.test(value)) return
    setEditingListQuantity(value)
  }

  const handleClearCart = () => {
    if (cartItems.length === 0) return
    const shouldClear = window.confirm('Clear all items from the cart?')
    if (!shouldClear) return
    clearCart()
    setToastMessage('Cart cleared')
    setShowToast(true)
  }

  const handleCartCheckout = async () => {
    if (cartDetails.detailedItems.length === 0) return
    const effectiveDate = toLocalDateKey(date) || getLocalISODate()

    const salesPayload = cartDetails.detailedItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      shopId: item.shopId || currentShopId,
      customer: customer.trim() || 'Walk-in Customer',
      city: city.trim() || 'Pune',
      date: effectiveDate,
    }))

    const allSaved = await addSalesBatch(salesPayload)

    if (!allSaved) {
      setToastMessage('Could not save full cart. Check connection and try again.')
      setShowToast(true)
      return
    }

    clearCart()
    setCustomer('')
    setCity('')
    setDate(getLocalISODate())
    setToastMessage('✓ Cart sales recorded!')
    setShowToast(true)
  }

  const clearSearch = () => {
    setSearchInput('')
  }

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Add Sale Entry</h2>
        <p>{currentShop?.name || DEFAULT_SHOP_ID} pricing is active for this screen.</p>
        <p>Select flavor, add quantity, then complete checkout quickly.</p>
      </div>

      <div className="glass-card entry-mode-toggle" role="tablist" aria-label="Entry mode switch">
        <button
          type="button"
          className={entryMode === 'card' ? 'active' : ''}
          onClick={() => setEntryMode('card')}
          role="tab"
          aria-selected={entryMode === 'card'}
        >
          Card View
        </button>
        <button
          type="button"
          className={entryMode === 'quick-list' ? 'active' : ''}
          onClick={() => setEntryMode('quick-list')}
          role="tab"
          aria-selected={entryMode === 'quick-list'}
        >
          Quick List View
        </button>
      </div>

      <div className="glass-card mobile-help">
        <p>
          {entryMode === 'card'
            ? 'Select a kulfi below to open the sale window.'
            : 'Set quantity bars quickly and add selected flavors to cart in one tap.'}
        </p>
      </div>

      <div className="glass-card cart-panel">
        <div className="cart-header">
          <h3>Selected Items Cart</h3>
          <span>{cartDetails.totalUnits.toLocaleString('en-IN')} units</span>
        </div>

        {cartDetails.detailedItems.length === 0 ? (
          <p className="cart-empty">No items in cart yet. Use Add to Cart from a selected flavor.</p>
        ) : (
          <>
            <div className="cart-list">
              {cartDetails.detailedItems.map((item) => (
                <div className="cart-row" key={item.productId}>
                  <div>
                    <p>{item.product.name}</p>
                    <small>
                      {item.quantity} x ₹{item.product.price.toLocaleString('en-IN')}
                    </small>
                  </div>
                  <div className="cart-row-right">
                    <strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                    <button type="button" className="delete-btn" onClick={() => removeCartItem(item.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <h3>Total Amount: ₹{cartDetails.totalAmount.toLocaleString('en-IN')}</h3>
              <div className="cart-actions-row">
                <button type="button" className="outline-btn" onClick={handleClearCart}>
                  Clear Cart
                </button>
                <button
                  ref={inPageCheckoutRef}
                  type="button"
                  className="cta-btn cta-large cart-checkout-btn"
                  onClick={handleCartCheckout}
                >
                  <span>Checkout Cart</span>
                  <span className={`branch-badge branch-badge-${currentShopId}`}>
                    {currentShop?.name?.replace(' Branch', '') || 'Branch'}
                  </span>
                  <span className="cta-arrow">→</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <form className="glass-card flavor-search-card" onSubmit={(event) => event.preventDefault()}>
        <div className="search-field-wrap">
          <svg className="search-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Type to search flavor..."
            aria-label="Search flavor"
            className="search-field-input"
          />
          {searchInput ? (
            <button
              type="button"
              className="search-field-clear-btn"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>
      </form>

      {entryMode === 'card' ? (
        <div className="flavor-grid">
          {filteredProducts.map((product) => (
            <FlavorCard
              key={product.id}
              product={product}
              selected={selectedProductId === product.id && isSheetOpen}
              onSelect={openSheet}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card quick-list-panel">
          <div className="quick-list-header">
            <h3>Quick Quantity List</h3>
            <span>{quickListProducts.length.toLocaleString('en-IN')} flavors</span>
          </div>

          <div className="quick-list-grid">
            {quickListProducts.map((product) => {
              const qty = Number(listQuantities[product.id] || 0)
              const sliderQty = Math.min(qty, 10)
              const isEditingQty = editingListProductId === product.id
              return (
                <div className="quick-list-row" key={product.id}>
                  <div className="quick-list-copy">
                    <p>{product.name}</p>
                    <small>₹{product.price.toLocaleString('en-IN')} each</small>
                  </div>

                  <div className="quick-list-controls">
                    <button type="button" className="stepper-btn" onClick={() => decreaseListQty(product.id)}>
                      -
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={sliderQty}
                      onChange={(event) => updateListQty(product.id, event.target.value)}
                      aria-label={`${product.name} quantity`}
                    />

                    <button type="button" className="stepper-btn" onClick={() => increaseListQty(product.id)}>
                      +
                    </button>

                    {isEditingQty ? (
                      <input
                        type="number"
                        className="quick-list-qty-input"
                        inputMode="numeric"
                        min="0"
                        autoFocus
                        value={editingListQuantity}
                        onChange={(event) => updateEditingListQuantity(event.target.value)}
                        onBlur={() => applyListQtyEdit(product.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            applyListQtyEdit(product.id)
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            cancelListQtyEdit()
                          }
                        }}
                        aria-label={`${product.name} exact quantity`}
                      />
                    ) : (
                      <button
                        type="button"
                        className="quick-list-qty-badge qty-edit-trigger"
                        onClick={() => startListQtyEdit(product.id)}
                        title="Tap to type exact quantity"
                        aria-label={`Edit ${product.name} quantity`}
                      >
                        {qty}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="quick-list-summary">
            <p>{quickListSummary.selectedFlavors.toLocaleString('en-IN')} selected flavors</p>
            <p>{quickListSummary.selectedUnits.toLocaleString('en-IN')} units</p>
            <p>₹{quickListSummary.selectedAmount.toLocaleString('en-IN')}</p>
          </div>

          {quickListSummary.selectedUnits > 0 ? <div className="quick-list-floating-spacer" aria-hidden="true" /> : null}
        </div>
      )}

      {entryMode === 'quick-list' && quickListSummary.selectedUnits > 0 ? (
        <div
          className={`quick-list-floating-add ${cartDetails.detailedItems.length > 0 ? 'with-mobile-checkout' : ''}`}
          role="region"
          aria-label="Quick add selected flavors"
        >
          <p>
            {quickListSummary.selectedUnits.toLocaleString('en-IN')} units • ₹
            {quickListSummary.selectedAmount.toLocaleString('en-IN')}
          </p>
          <div className="quick-list-floating-actions">
            <button type="button" className="outline-btn" onClick={clearListSelection}>
              Reset
            </button>
            <button type="button" className="cta-btn" onClick={addListSelectionToCart}>
              <span>Add Selected to Cart</span>
              <span className={`branch-badge branch-badge-${currentShopId}`}>
                {currentShop?.name?.replace(' Branch', '') || 'Branch'}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {filteredProducts.length === 0 ? (
        <div className="glass-card mobile-help">
          <p>No flavors matched your search.</p>
        </div>
      ) : null}

      <div className="glass-card sale-details-panel">
        <h3>Sale Details</h3>
        <div className="form-grid sale-details-grid">
          <label>
            Customer / Retailer
            <input
              type="text"
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              placeholder="Walk-in Customer"
            />
          </label>

          <label>
            City
            <input type="text" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Pune" />
          </label>

          <label>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
        </div>
      </div>

      {entryMode === 'card' && isSheetOpen && selectedProduct ? (
        <div className="sheet-backdrop" onClick={closeSheet}>
          <form className="glass-card sale-sheet" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
            <div
              className="sheet-handle"
              onTouchStart={handleSheetTouchStart}
              onTouchEnd={handleSheetTouchEnd}
              title="Swipe down to close"
              aria-hidden="true"
            />

            <div className="sheet-header">
              <div className="sheet-product">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="sheet-product-image"
                  onError={handleImageError}
                />
                <div>
                  <h3>{selectedProduct.name}</h3>
                  <p>₹{selectedProduct.price.toLocaleString('en-IN')} per unit</p>
                  {cartDetails.detailedItems.length > 0 ? (
                    <span className="sheet-cart-indicator">
                      🛒 Cart: {cartDetails.totalUnits} {cartDetails.totalUnits === 1 ? 'unit' : 'units'} · ₹{cartDetails.totalAmount.toLocaleString('en-IN')}
                    </span>
                  ) : null}
                </div>
              </div>

              <button type="button" className="outline-btn" onClick={closeSheet}>
                Close
              </button>
            </div>

            <div className="quantity-panel">
              <span>Quantity</span>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => updateQuantity(Math.max(1, (Number(quantity) || 1) - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => updateQuantity(event.target.value)}
                  aria-label="Quantity"
                  required
                />
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => updateQuantity((Number(quantity) || 1) + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="quick-qty-row">
              {[1, 5, 10, 20].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`quick-qty ${Number(quantity) === value ? 'active' : ''}`}
                  onClick={() => updateQuantity(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="sheet-actions">
              {cartDetails.detailedItems.length > 0 ? (
                <>
                  <button
                    type="submit"
                    className="outline-btn"
                    title="Record only this item as an instant separate sale"
                  >
                    <span>Sell this only · ₹{((Number(quantity) || 1) * selectedProduct.price).toLocaleString('en-IN')}</span>
                    <span className={`branch-badge branch-badge-${currentShopId}`}>
                      {currentShop?.name?.replace(' Branch', '') || 'Branch'}
                    </span>
                  </button>
                  <button type="button" className="cta-btn cta-full" onClick={handleAddToCart}>
                    <span>Add to Cart · ₹{((Number(quantity) || 1) * selectedProduct.price).toLocaleString('en-IN')}</span>
                    <span className={`branch-badge branch-badge-${currentShopId}`}>
                      {currentShop?.name?.replace(' Branch', '') || 'Branch'}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="outline-btn" onClick={handleAddToCart}>
                    <span>Add to Cart</span>
                    <span className={`branch-badge branch-badge-${currentShopId}`}>
                      {currentShop?.name?.replace(' Branch', '') || 'Branch'}
                    </span>
                  </button>
                  <button type="submit" className="cta-btn cta-full">
                    <span>Add to Sale · ₹{((Number(quantity) || 1) * selectedProduct.price).toLocaleString('en-IN')}</span>
                    <span className={`branch-badge branch-badge-${currentShopId}`}>
                      {currentShop?.name?.replace(' Branch', '') || 'Branch'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      ) : null}

      {cartDetails.detailedItems.length > 0 && !isSheetOpen && !isInPageCheckoutVisible ? (
        <div className="mobile-sticky-checkout" role="region" aria-label="Cart checkout">
          <p>
            {cartDetails.totalUnits.toLocaleString('en-IN')} units • ₹{cartDetails.totalAmount.toLocaleString('en-IN')}
          </p>
          <button type="button" className="cta-btn" onClick={handleCartCheckout}>
            <span>Checkout Cart</span>
            <span className={`branch-badge branch-badge-${currentShopId}`}>
              {currentShop?.name?.replace(' Branch', '') || 'Branch'}
            </span>
            <span>→</span>
          </button>
        </div>
      ) : null}

      <ToastNotification show={showToast} message={toastMessage} />
    </section>
  )
}

export default AddSale
