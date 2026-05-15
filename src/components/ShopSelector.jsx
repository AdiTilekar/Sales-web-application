import { useSales } from '../context/SalesContext'
import { SHOPS } from '../data/products'

const ShopSelector = () => {
  const { currentShopId, setCurrentShopId, currentShop } = useSales()

  return (
    <label className="shop-selector" aria-label="Select sales branch">
      <span className="shop-selector-label">Branch</span>
      <select value={currentShopId} onChange={(event) => setCurrentShopId(event.target.value)}>
        {SHOPS.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
      <span className="shop-selector-value">{currentShop?.name}</span>
    </label>
  )
}

export default ShopSelector