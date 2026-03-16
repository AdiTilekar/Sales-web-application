import { useEffect, useMemo, useState } from 'react'
import FlavorCard from '../components/FlavorCard'
import ToastNotification from '../components/ToastNotification'
import { useSales } from '../context/SalesContext'

const AddSale = () => {
  const { products, addSale } = useSales()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [customer, setCustomer] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showToast, setShowToast] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedProduct = products.find((product) => product.id === selectedProductId)

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const normalized = searchQuery.trim().toLowerCase()
    return products.filter((product) => product.name.toLowerCase().includes(normalized))
  }, [products, searchQuery])

  useEffect(() => {
    if (!showToast) return undefined
    const timer = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(timer)
  }, [showToast])

  const openSheet = (productId) => {
    setSelectedProductId(productId)
    setQuantity(1)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setSelectedProductId('')
  }

  const updateQuantity = (nextValue) => {
    const normalized = Number(nextValue)
    if (Number.isNaN(normalized)) return
    setQuantity(Math.max(1, normalized))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selectedProductId || !quantity || Number(quantity) <= 0) return

    addSale({
      productId: selectedProductId,
      quantity: Number(quantity),
      customer: customer.trim() || 'Walk-in Customer',
      city: city.trim() || 'Pune',
      date,
    })

    setQuantity(1)
    setCustomer('')
    setCity('')
    setDate(new Date().toISOString().split('T')[0])
    closeSheet()
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
        <p>Tap a flavor, choose quantity, and save quickly on mobile.</p>
      </div>

      <div className="glass-card mobile-help">
        <p>Select a kulfi below to open the sale window.</p>
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

            <div className="form-grid compact-form-grid">
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
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Pune"
                />
              </label>

              <label>
                Date
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </label>
            </div>

            <button type="submit" className="cta-btn cta-large cta-full">
              Add to Sales Record →
            </button>
          </form>
        </div>
      ) : null}

      <ToastNotification show={showToast} message="✓ Sale recorded!" />
    </section>
  )
}

export default AddSale
