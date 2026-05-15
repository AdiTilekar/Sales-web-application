# Multi-Franchise Implementation Plan
## Ganesh Kulfi Sales App - Support for 2 Shops with Different Pricing

---

## 📋 Executive Summary

Convert the current single-store sales tracking app into a **multi-franchise system** with:
- ✅ Two separate branches (Chikhali Branch & Akurdi Branch)
- ✅ Different pricing tiers for each shop
- ✅ Separate sales analysis sections
- ✅ Shop-specific dashboards and reports
- ✅ Unified management interface with shop selection

---

## 🏪 Shop Configuration

### Shop 1 (Original)
- **Name**: Chikhali Branch
- **Pricing**: Original prices
  - 25 Rs products: Mango, Rabdi, Small Rabdi, Chocolate, Paan, Strawberry, Sitafal, Gulkand, Pineapple, Red Peru, Jamun, Chikoo, Mava, Butterscotch
  - 30 Rs products: Dry Fruit, Pista, Anjeer

### Shop 2 (New Franchise)
- **Name**: Akurdi Branch
- **Pricing**: Increased rates
  - 25 Rs → **30 Rs** (same products as Shop 1)
  - 30 Rs → **35 Rs** (same products as Shop 1)

---

## 🏗️ Architecture Changes

### 1. Data Structure Enhancement

#### File: `src/data/products.js`
**Current**: Single PRODUCTS array
**New**: Multi-shop product configuration
```
SHOPS = {
  'shop-1': { name: 'Shop 1', location: 'Location 1' },
  'shop-2': { name: 'Shop 2', location: 'Location 2' }
}

getProductsForShop(shopId) → returns price-adjusted products
```

#### Database Schema Changes (Supabase)
```sql
-- Add shop_id column to sales table
ALTER TABLE sales ADD COLUMN shop_id TEXT DEFAULT 'shop-1';
```

### 2. Context Changes
**File**: `src/context/SalesContext.jsx`

#### New State Variables:
- `currentShopId` - Currently selected shop (default: 'shop-1')
- `shopFilter` - For filtering across shops
- `getProductsForShop(shopId)` - Method to get price-adjusted products

#### Updated Methods:
- `addSale(saleData)` → Include `shopId` in payload
- `allSales` filter → Add shop-specific filtering
- `productMap` → Make shop-aware

---

## 📝 Feature Implementation Roadmap

### Phase 1: Data Layer (Foundation)
**Priority**: CRITICAL - Must complete first

#### 1.1 Create Shop Configuration
- [ ] Update `src/data/products.js` with shop definitions
- [ ] Create `getProductsForShop()` function
- [ ] Export `SHOPS` constant

#### 1.2 Update SalesContext
- [ ] Add `currentShopId` state
- [ ] Add `setCurrentShopId()` action
- [ ] Create `getProductsForShop()` method
- [ ] Update `addSale()` to include `shopId`
- [ ] Update `allSales` to support shop filtering
- [ ] Update storage keys to include shop context

#### 1.3 Migrate Database
- [ ] Add `shop_id` column to sales table
- [ ] Backfill existing sales with `shop-1` (default)
- [ ] Add constraint to ensure shop_id is set

---

### Phase 2: UI Components (Presentation)
**Priority**: HIGH

#### 2.1 Create Shop Selector Component
- [ ] New file: `src/components/ShopSelector.jsx`
- [ ] Displays: Shop 1 / Shop 2 tabs or dropdown
- [ ] Shows: Shop name, location badge
- [ ] Saves selection to context
- [ ] Location: Navbar or separate filter bar

#### 2.2 Update Navbar
- [ ] Add ShopSelector component
- [ ] Show current shop with indicator
- [ ] Responsive design for mobile/desktop

#### 2.3 Update AddSale Page
- [ ] Prominently display current shop
- [ ] Show shop-specific prices
- [ ] Add shop selector dropdown
- [ ] Quick switch between shops
- [ ] Validation: Ensure shop is selected before recording

---

### Phase 3: Analytics Pages (Core Logic)
**Priority**: HIGH

#### 3.1 Dashboard Page (`src/pages/Dashboard.jsx`)
- [ ] Add shop filter/selector at top
- [ ] Filter all metrics by selected shop:
  - Revenue (shop-specific pricing)
  - Profit (shop-specific margins)
  - Units sold
  - Top flavors
- [ ] Charts should reflect selected shop only
- [ ] Option: "Compare Shops" mode (future enhancement)

#### 3.2 Flavor Analysis (`src/pages/FlavorAnalysis.jsx`)
- [ ] Add shop selector
- [ ] Filter products by shop
- [ ] Show shop-specific pricing in comparisons
- [ ] Update profit calculations with shop prices
- [ ] Pie/Bar charts show only selected shop

#### 3.3 History Page (`src/pages/History.jsx`)
- [ ] Add shop column to sales table
- [ ] Filter by shop
- [ ] Shop indicator badge
- [ ] Delete functionality respects shop context

#### 3.4 Records Page (`src/pages/Records.jsx`)
- [ ] Add shop column
- [ ] Filter by shop
- [ ] Edit modal includes shop selection
- [ ] Shop switching possible from record view

#### 3.5 Reports Page (`src/pages/Reports.jsx`)
- [ ] Add shop filter
- [ ] Excel exports include shop column
- [ ] Summary stats per shop
- [ ] Comparative reports (both shops)

---

### Phase 4: Reporting & Export (Advanced)
**Priority**: MEDIUM

#### 4.1 Excel Report Updates (`src/utils/excelReport.js`)
- [ ] Add shop column to exports
- [ ] Include shop-specific pricing in summary
- [ ] Summary sheet: Side-by-side shop comparison
- [ ] Separate worksheets per shop (optional)

#### 4.2 Create Shop Comparison Report
- [ ] New utility function
- [ ] Compare revenue, profit, units by flavor
- [ ] Show price difference impact
- [ ] Generate PDF/Excel

---

## 🔄 Data Migration Strategy

### Step 1: Schema Update
```sql
ALTER TABLE sales ADD COLUMN shop_id TEXT DEFAULT 'shop-1' NOT NULL;
CREATE INDEX idx_sales_shop_id ON sales(shop_id);
```

### Step 2: Backfill Existing Data
```sql
UPDATE sales SET shop_id = 'shop-1' WHERE shop_id IS NULL;
```

### Step 3: Update Application
- Deploy code with shop_id support
- Verify data integrity
- No data loss

---

## 💾 Storage Strategy

### LocalStorage Keys
**Current**: `kulfi-sales-records-v2`
**New**: `kulfi-sales-records-v2-shop-1`, `kulfi-sales-records-v2-shop-2`

- Separate localStorage per shop for offline support
- OR: Single key with shop array + shop filter

**Recommended**: Separate keys for better isolation

---

## 🎨 UI/UX Considerations

### 1. Shop Indicator
- Always visible: Shop name + badge in header
- Color coding: Shop 1 = Blue badge, Shop 2 = Orange badge
- Mobile: Compact indicator or tab view

### 2. Quick Shop Switch
- Single tap/click to switch shops
- Confirmation: "Switched to Shop 2" toast notification
- Preserves current page context

### 3. Pricing Clarity
- Show prices in product cards
- On dashboard: Include pricing tier in metrics
- In flavor analysis: Show price multiplier effect

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] `getProductsForShop()` returns correct prices
- [ ] Shop filter works in sales array
- [ ] localStorage handles multi-shop data
- [ ] Supabase queries filter by shop

### Integration Tests
- [ ] Add sale in Shop 1 → appears in Shop 1 only
- [ ] Add sale in Shop 2 → appears in Shop 2 only
- [ ] Dashboard filters correctly
- [ ] Reports include shop information
- [ ] Export generates correct shop data

### Manual Testing
- [ ] Add 5 sales in Shop 1, 5 in Shop 2
- [ ] Verify dashboard shows different metrics
- [ ] Check flavor analysis separates shops
- [ ] Test switching shops mid-session
- [ ] Verify pricing differences reflected
- [ ] Test offline mode with both shops
- [ ] Cloud sync handles shop data

---

## 📊 Expected Metrics After Implementation

**Shop 1** (Original pricing):
- 25 Rs items: Normal revenue
- 30 Rs items: Normal revenue

**Shop 2** (Premium pricing):
- 25 Rs items: +20% revenue (30 Rs vs 25 Rs)
- 30 Rs items: +16.7% revenue (35 Rs vs 30 Rs)
- Expected profit margin: Higher for Shop 2

---

## 🚀 Deployment Timeline

### Phase 1: Data Layer (2-3 hours)
- [ ] Products configuration
- [ ] Context updates
- [ ] Database migration

### Phase 2: UI Components (2-3 hours)
- [ ] ShopSelector component
- [ ] Navbar integration
- [ ] AddSale updates

### Phase 3: Analytics (4-5 hours)
- [ ] Dashboard filtering
- [ ] History/Records updates
- [ ] Reports integration

### Phase 4: Export & Testing (2-3 hours)
- [ ] Excel export updates
- [ ] Comprehensive testing
- [ ] Bug fixes

**Total Estimated Time**: 10-14 hours

---

## 🔑 Key Implementation Files (Priority Order)

1. **src/data/products.js** - Shop definitions & pricing
2. **src/context/SalesContext.jsx** - State management
3. **src/lib/supabaseClient.js** - Query updates (if needed)
4. **src/components/ShopSelector.jsx** - NEW
5. **src/components/Navbar.jsx** - Integrate selector
6. **src/pages/AddSale.jsx** - Shop context
7. **src/pages/Dashboard.jsx** - Filter by shop
8. **src/pages/FlavorAnalysis.jsx** - Filter by shop
9. **src/pages/History.jsx** - Shop column & filter
10. **src/pages/Records.jsx** - Shop column & filter
11. **src/pages/Reports.jsx** - Shop filter
12. **src/utils/excelReport.js** - Shop exports

---

## 🎯 Success Criteria

✅ Each branch has independent sales tracking
✅ Prices automatically adjusted per branch
✅ Dashboard/Analysis shows only selected branch
✅ No data loss during migration
✅ Offline mode works for both shops
✅ Cloud sync includes shop data
✅ Reports clearly identify shop data
✅ Performance: No significant slowdown

---

## 💡 Future Enhancements (Phase 2+)

1. **Side-by-side Shop Comparison Dashboard**
   - Revenue comparison charts
   - Profit margin analysis
   - Top products by shop
   - Growth trends

2. **Multi-Shop Aggregation**
   - Combined metrics view
   - Total company revenue
   - Average margins across shops

3. **Shop-Specific Reports**
   - Auto-generated daily reports per shop
   - Email notifications
   - Cloud sync of reports

4. **Staff/User Assignment**
   - Track which user added sale
   - User-to-shop mapping
   - Staff performance metrics

5. **Dynamic Pricing**
   - Adjust prices per shop anytime
   - Pricing history & analytics
   - Promotional pricing support

---

**Last Updated**: May 15, 2026
**Status**: Ready for Implementation
**Author**: Ganesh Kulfi Sales Team
