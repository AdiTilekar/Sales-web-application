import { useSales } from '../context/SalesContext'
import { SHOPS } from '../data/products'

const ShopSelector = () => {
  const { currentShopId, setCurrentShopId } = useSales()

  return (
    <div className="shop-selector">
      <label className="shop-selector-label">Branch:</label>
      <select 
        value={currentShopId} 
        onChange={(e) => setCurrentShopId(e.target.value)}
        className="shop-selector-select"
      >
        {SHOPS.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ShopSelector