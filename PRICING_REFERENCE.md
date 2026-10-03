# Shree Ganesh Kulfi – Pricing Reference Guide

## Branch Overview & Strategy
- **Chikhali Branch (`shop-1`)**: Standard Base Pricing (`priceAdjustment: 0`).
- **Akurdi Branch (`shop-2`)**: Premium Retail Pricing (`priceAdjustment: +₹5` for standard items).

---

## Flavor Pricing Matrix

| Flavor ID | Flavor Name | Chikhali (`shop-1`) | Akurdi (`shop-2`) | Unit Cost (Base) | Unit Profit (Base) | Notes |
|---|---|---|---|---|---|---|
| `mango` | Mango | ₹30 | ₹35 | ₹23 | ₹7 | Standard |
| `rabdi` | Rabdi | ₹30 | ₹35 | ₹23 | ₹7 | Standard |
| `small-rabdi` | Small Rabdi Kulfi | ₹15 | ₹15 | ₹10 | ₹5 | **Fixed Price Policy**: Flat ₹15 across all branches for budget mini kulfi |
| `dry-fruit` | Dry Fruit | ₹35 | ₹40 | ₹31 | ₹4 | Premium |
| `pista` | Pista | ₹35 | ₹40 | ₹28 | ₹7 | Premium |
| `chocolate` | Chocolate | ₹30 | ₹35 | ₹28 | ₹2 | Standard |
| `paan` | Paan | ₹30 | ₹35 | ₹27 | ₹3 | Standard |
| `strawberry` | Strawberry | ₹30 | ₹35 | ₹26 | ₹4 | Standard |
| `sitafal` | Sitafal | ₹30 | ₹35 | ₹28 | ₹2 | Standard |
| `gulkand` | Gulkand | ₹30 | ₹35 | ₹23 | ₹7 | Standard |
| `pineapple` | Pineapple | ₹30 | ₹35 | ₹26 | ₹4 | Standard |
| `red-peru` | Red Peru | ₹30 | ₹35 | ₹26 | ₹4 | Standard |
| `jamun` | Jamun | ₹30 | ₹35 | ₹26 | ₹4 | Standard |
| `chikoo` | Chikoo | ₹30 | ₹35 | ₹26 | ₹4 | Standard |
| `anjeer` | Anjeer | ₹35 | ₹40 | ₹31 | ₹4 | Premium |
| `mava` | Mava Kulfi | ₹30 | ₹35 | ₹26 | ₹4 | Standard |
| `butterscotch` | Butterscotch | ₹30 | ₹35 | ₹26 | ₹4 | Standard |

---

## Architectural Implementation Rules
1. **Dynamic Price Resolution**:
   Prices are computed via `getProductsForShop(shopId)`:
   ```javascript
   export const getProductsForShop = (shopId = DEFAULT_SHOP_ID) => {
     const shop = SHOP_BY_ID[shopId] || SHOP_BY_ID[DEFAULT_SHOP_ID]
     return PRODUCTS.map((product) => ({
       ...product,
       price: product.id === 'small-rabdi' ? product.price : product.price + (shop?.priceAdjustment || 0),
     }))
   }
   ```
2. **Snapshot Integrity**:
   Each staged cart item snapshots its `unitPrice`, `shopId`, and `shopName` at addition time.
3. **Branch Switching**:
   If a user switches branch with an active cart, a confirmation warning is displayed, and upon confirmation the cart is reset to ensure no cross-branch price contamination occurs.
