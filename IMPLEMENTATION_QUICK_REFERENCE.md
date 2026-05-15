# Quick Implementation Reference
## Multi-Franchise Setup - Key Code Changes

---

## 1️⃣ STEP 1: Update Products Configuration
**File**: `src/data/products.js`

```javascript
// Add shop definitions
export const SHOPS = {
  'shop-1': {
    id: 'shop-1',
    name: 'Shop 1',
    location: 'Main Store',
    color: 'blue'
  },
  'shop-2': {
    id: 'shop-2',
    name: 'Shop 2', 
    location: 'Franchise',
    color: 'orange'
  }
}

// Pricing adjustments for Shop 2
const SHOP_2_PRICE_MULTIPLIERS = {
  25: 30,  // 25 Rs → 30 Rs
  30: 35   // 30 Rs → 35 Rs
}

// Function to get products for specific shop
export function getProductsForShop(shopId) {
  return PRODUCTS.map(product => {
    if (shopId === 'shop-1') return product
    
    // Shop 2: Apply price adjustments
    const newPrice = SHOP_2_PRICE_MULTIPLIERS[product.price] || product.price
    return {
      ...product,
      price: newPrice,
      shopId // Add shop reference
    }
  })
}
```

---

## 2️⃣ STEP 2: Update SalesContext
**File**: `src/context/SalesContext.jsx`

```javascript
// Add to state
const [currentShopId, setCurrentShopId] = useState('shop-1')

// Add method to get products for current shop
const getProductsForCurrentShop = useCallback(() => {
  return getProductsForShop(currentShopId)
}, [currentShopId])

// Update addSale to include shopId
const addSale = async (saleData) => {
  const normalizedSale = {
    ...saleData,
    shopId: currentShopId, // ← Add this
    // ... rest of logic
  }
  // ... continue
}

// Update allSales filtering (optional - keep all, filter in UI)
// OR filter here if you want shop-specific allSales

// Export new method
return {
  currentShopId,
  setCurrentShopId,
  getProductsForShop,
  // ... existing exports
}
```

---

## 3️⃣ STEP 3: Create Shop Selector Component
**File**: `src/components/ShopSelector.jsx` (NEW)

```javascript
import { useSales } from '../context/SalesContext'
import { SHOPS } from '../data/products'
import './ShopSelector.css'

export default function ShopSelector() {
  const { currentShopId, setCurrentShopId } = useSales()
  
  return (
    <div className="shop-selector">
      {Object.values(SHOPS).map(shop => (
        <button
          key={shop.id}
          className={`shop-btn ${currentShopId === shop.id ? 'active' : ''}`}
          onClick={() => setCurrentShopId(shop.id)}
        >
          <span className={`badge ${shop.color}`}></span>
          <span>{shop.name}</span>
        </button>
      ))}
    </div>
  )
}
```

---

## 4️⃣ STEP 4: Update Navbar
**File**: `src/components/Navbar.jsx`

```javascript
import ShopSelector from './ShopSelector'

export default function Navbar() {
  return (
    <header className="navbar glass-card">
      <div className="brand-wrap">
        {/* ... existing logo code ... */}
      </div>
      
      <ShopSelector /> {/* ← Add this */}
      
      <nav className="nav-links">
        {/* ... existing nav links ... */}
      </nav>
    </header>
  )
}
```

---

## 5️⃣ STEP 5: Update AddSale Page
**File**: `src/pages/AddSale.jsx`

```javascript
// Update to show shop in heading
const AddSale = () => {
  const { products, currentShopId } = useSales()
  // ... rest of component
  
  return (
    <section className="page page-enter">
      <div className="page-header">
        <h2>Add Sale - {currentShopId === 'shop-1' ? 'Shop 1' : 'Shop 2'}</h2>
        <p>Recording sales for selected shop with appropriate pricing.</p>
      </div>
      
      {/* Show current shop pricing */}
      <div className="shop-info glass-card">
        {currentShopId === 'shop-2' && (
          <p className="info-text">
            ℹ️ Premium pricing active: 25Rs→30Rs, 30Rs→35Rs
          </p>
        )}
      </div>
      
      {/* ... rest of form ... */}
    </section>
  )
}
```

---

## 6️⃣ STEP 6: Update Dashboard Filtering
**File**: `src/pages/Dashboard.jsx`

```javascript
// Filter sales by current shop
const filteredSales = useMemo(() => {
  return allSales
    .filter(sale => {
      // Add shop filter
      if (sale.shopId && sale.shopId !== currentShopId) return false
      // ... existing filters
      return true
    })
}, [allSales, currentShopId, /* ... existing deps ... */])

// Or if you want to show all shops' data:
// const filteredSales = useMemo(() => {
//   return allSales.filter(sale => {
//     // existing filters only, no shop filtering
//   })
// }, [allSales, /* existing deps */])
```

---

## 7️⃣ STEP 7: Update Other Pages
Same pattern for:
- `FlavorAnalysis.jsx`
- `History.jsx`
- `Records.jsx`
- `Reports.jsx`

```javascript
// Template for each page:
const filteredSales = useMemo(() => {
  return allSales.filter(sale => {
    if (sale.shopId && sale.shopId !== currentShopId) return false
    // ... existing filter logic
    return true
  })
}, [allSales, currentShopId, /* ...existing deps... */])
```

---

## 8️⃣ STEP 8: Database Migration (Supabase)
**File**: Run in Supabase SQL Editor

```sql
-- Add shop_id column
ALTER TABLE sales 
ADD COLUMN shop_id TEXT DEFAULT 'shop-1' NOT NULL;

-- Create index for faster queries
CREATE INDEX idx_sales_shop_id ON sales(shop_id);

-- Verify backfill
SELECT COUNT(*) FROM sales WHERE shop_id = 'shop-1';
```

---

## 9️⃣ STEP 9: Update Storage Keys
**File**: `src/context/SalesContext.jsx`

```javascript
// BEFORE
const STORAGE_KEY = 'kulfi-sales-records-v2'

// AFTER - Keep both for backward compatibility
const STORAGE_KEY = 'kulfi-sales-records-v2'
const STORAGE_KEY_SHOP_1 = 'kulfi-sales-records-v2-shop-1'
const STORAGE_KEY_SHOP_2 = 'kulfi-sales-records-v2-shop-2'

// When saving to localStorage, use shop-specific key
// When reading, check shop-specific first, then fallback to old key
```

---

## 🔟 STEP 10: Export Updates
**File**: `src/utils/excelReport.js`

```javascript
// Add shop column to export
export function downloadExcelReport(sales, products, fileName) {
  const enhancedData = sales.map(sale => ({
    ...sale,
    shop: sale.shopId === 'shop-1' ? 'Shop 1' : 'Shop 2', // ← Add this
    // ... existing fields
  }))
  
  // Continue with existing export logic
  // Add shop column to worksheet
}
```

---

## 📋 Verification Checklist

After implementing each step:

- [ ] Products show correct prices per shop
- [ ] Shop selector appears in navbar
- [ ] Current shop displays in page headers
- [ ] AddSale records sales with shop_id
- [ ] Dashboard filters by selected shop
- [ ] Switching shops updates all pages
- [ ] Historical data shows shop column
- [ ] Excel exports include shop information
- [ ] No console errors
- [ ] Offline mode works
- [ ] Cloud sync includes shop_id

---

## 🧪 Test Data Creation

Once implemented, create test data:

**Shop 1** (10 sales):
- 5 × Mango (25 Rs)
- 5 × Pista (30 Rs)

**Shop 2** (10 sales):
- 5 × Mango (30 Rs)
- 5 × Pista (35 Rs)

**Expected Results**:
- Shop 1 Revenue: 5×25 + 5×30 = ₹275
- Shop 2 Revenue: 5×30 + 5×35 = ₹325
- Difference: ₹50 (18% more for Shop 2)

---

## 🚀 Deployment Steps

1. Create feature branch: `git checkout -b feature/multi-franchise`
2. Implement steps 1-3 (data & context)
3. Test locally with sample data
4. Implement steps 4-7 (UI updates)
5. Test with both shops
6. Run database migration (step 8)
7. Implement step 9 (storage updates)
8. Test end-to-end
9. Implement step 10 (exports)
10. Final comprehensive testing
11. Merge to main and deploy

---

## ⚠️ Important Notes

- **Backward Compatibility**: Existing sales without shop_id default to 'shop-1'
- **No Data Loss**: All existing sales preserved, just add shop_id
- **Gradual Migration**: Can migrate to new storage keys over time
- **Testing**: Test thoroughly with both online & offline modes
- **Cloud Sync**: Ensure Supabase schema updated before deploying app code

---

**Ready to Start? → Begin with Step 1: Update Products Configuration**
