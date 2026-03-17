import { useEffect, useMemo, useState } from 'react'
import FlavorCard from '../components/FlavorCard'
import ToastNotification from '../components/ToastNotification'
import { useSales } from '../context/SalesContext'

const AddSale = () => {
  const { products, addSale } = useSales()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [customer, setCustomer] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('✓ Sale recorded!')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState([])

  const selectedProduct = products.find((product) => product.id === selectedProductId)

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const normalized = searchQuery.trim().toLowerCase()
    return products.filter((product) => product.name.toLowerCase().includes(normalized))
  }, [products, searchQuery])

  const cartDetails = useMemo(() => {
    const detailedItems = cartItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return null
        return {
          ...item,
          product,
          amount: item.quantity * product.price,
        }
      })
      .filter(Boolean)

    const totalAmount = detailedItems.reduce((sum, item) => sum + item.amount, 0)
    const totalUnits = detailedItems.reduce((sum, item) => sum + item.quantity, 0)

    return { detailedItems, totalAmount, totalUnits }
  }, [cartItems, products])

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

  const openSheet = (productId) => {
    setSelectedProductId(productId)
    setQuantity('')
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setSelectedProductId('')
  }

  const updateQuantity = (nextValue) => {
    if (nextValue === '' || nextValue == null) {
      setQuantity('')
      return
    }
    const normalized = Number(nextValue)
    if (Number.isNaN(normalized) || normalized < 0) return
    setQuantity(normalized)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedProductId || !quantity || Number(quantity) <= 0) return

    const isSaved = await addSale({
      productId: selectedProductId,
      quantity: Number(quantity),
      customer: customer.trim() || 'Walk-in Customer',
      city: city.trim() || 'Pune',
      date,
    })

    if (!isSaved) {
      setToastMessage('Could not save sale. Check connection and try again.')
      setShowToast(true)
      return
    }

    setQuantity('')
    setCustomer('')
    setCity('')
    setDate(new Date().toISOString().split('T')[0])
    closeSheet()
    setToastMessage('✓ Sale recorded!')
    setShowToast(true)
  }

  const handleAddToCart = () => {
    if (!selectedProductId || !quantity || Number(quantity) <= 0) return

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === selectedProductId)
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProductId
            ? { ...item, quantity: item.quantity + Number(quantity) }
            : item,
        )
      }

      return [...prev, { productId: selectedProductId, quantity: Number(quantity) }]
    })

    setToastMessage('Item added to cart')
    setShowToast(true)
    closeSheet()
    setQuantity('')
  }

  const removeCartItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const handleClearCart = () => {
    if (cartItems.length === 0) return
    const shouldClear = window.confirm('Clear all items from the cart?')
    if (!shouldClear) return
    setCartItems([])
    setToastMessage('Cart cleared')
    setShowToast(true)
  }

  const handleCartCheckout = async () => {
    if (cartDetails.detailedItems.length === 0) return

    let allSaved = true
    for (const item of cartDetails.detailedItems) {
      const saved = await addSale({
        productId: item.productId,
        quantity: item.quantity,
        customer: customer.trim() || 'Walk-in Customer',
        city: city.trim() || 'Pune',
        date,
      })
      if (!saved) {
        allSaved = false
        break
      }
    }

    if (!allSaved) {
      setToastMessage('Could not save full cart. Check connection and try again.')
      setShowToast(true)
      return
    }

    setCartItems([])
    setCustomer('')
    setCity('')
    setDate(new Date().toISOString().split('T')[0])
    setToastMessage('✓ Cart sales recorded!')
    setShowToast(true)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setSearchQuery(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Add Sale Entry</h2>
        <p>Select flavor, add quantity, then complete checkout quickly.</p>
      </div>

      <div className="glass-card mobile-help">
        <p>Select a kulfi below to open the sale window.</p>
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
                <button type="button" className="cta-btn cta-large" onClick={handleCartCheckout}>
                  Add Cart to Sale →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <form className="glass-card flavor-search" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search flavor..."
          aria-label="Search flavor"
        />
        <button type="submit" className="cta-btn">
          Search Flavor
        </button>
        <button type="button" className="outline-btn" onClick={clearSearch}>
          Clear
        </button>
      </form>

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

      {isSheetOpen && selectedProduct ? (
        <div className="sheet-backdrop" onClick={closeSheet}>
          <form className="glass-card sale-sheet" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div className="sheet-product">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="sheet-product-image" />
                <div>
                  <h3>{selectedProduct.name}</h3>
                  <p>₹{selectedProduct.price.toLocaleString('en-IN')} per unit</p>
                </div>
              </div>

              <button type="button" className="outline-btn" onClick={closeSheet}>
                Close
              </button>
            </div>

            <div className="quantity-panel">
              <span>Quantity</span>
              <div className="stepper">
                <button type="button" className="stepper-btn" onClick={() => updateQuantity(quantity - 1)}>
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => updateQuantity(event.target.value)}
                  required
                />
                <button type="button" className="stepper-btn" onClick={() => updateQuantity(quantity + 1)}>
                  +
                </button>
              </div>
            </div>

            <div className="quick-qty-row">
              {[1, 5, 10, 20].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`quick-qty ${quantity === value ? 'active' : ''}`}
                  onClick={() => updateQuantity(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="sheet-actions">
              <button type="button" className="outline-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button type="submit" className="cta-btn cta-full">
                Add to Sale
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {cartDetails.detailedItems.length > 0 ? (
        <div className="mobile-sticky-checkout" role="region" aria-label="Cart checkout">
          <p>
            {cartDetails.totalUnits.toLocaleString('en-IN')} units • ₹{cartDetails.totalAmount.toLocaleString('en-IN')}
          </p>
          <button type="button" className="cta-btn" onClick={handleCartCheckout}>
            Checkout Cart
          </button>
        </div>
      ) : null}

      <ToastNotification show={showToast} message={toastMessage} />
    </section>
  )
}

export default AddSale
