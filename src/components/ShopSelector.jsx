import { useState } from 'react'
import { useSales } from '../context/SalesContext'
import { SHOPS } from '../data/products'

const ShopSelector = () => {
  const { currentShopId, setCurrentShopId, currentShop } = useSales()
  const [isOpen, setIsOpen] = useState(false)

  const handleShopChange = (shopId) => {
    setCurrentShopId(shopId)
    setIsOpen(false)
  }

  const getBranchEmoji = (shopName) => {
    if (shopName?.includes('Chikhali')) return '🏪'
    if (shopName?.includes('Akurdi')) return '🏬'
    return '🍦'
  }

  return (
    <div className="shop-selector-wrapper">
      <button
        className={`shop-selector-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select sales branch"
        aria-expanded={isOpen}
      >
        <span className="branch-emoji">{getBranchEmoji(currentShop?.name)}</span>
        <span className="branch-name">{currentShop?.name || 'Select Branch'}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="shop-selector-menu">
          {SHOPS.map((shop) => (
            <button
              key={shop.id}
              className={`shop-option ${currentShopId === shop.id ? 'active' : ''}`}
              onClick={() => handleShopChange(shop.id)}
              aria-pressed={currentShopId === shop.id}
            >
              <span className="option-emoji">{getBranchEmoji(shop.name)}</span>
              <span className="option-text">{shop.name}</span>
              {shop.priceAdjustment > 0 && (
                <span className="price-badge">+₹{shop.priceAdjustment}</span>
              )}
              {currentShopId === shop.id && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ShopSelector