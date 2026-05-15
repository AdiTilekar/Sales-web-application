# Current vs. New Architecture Comparison

## 📊 Current System (Single Shop)

```
┌─────────────────────────────────────────────────────────┐
│                     GANESH KULFI APP                    │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌─────────┐      ┌─────────────┐    ┌─────────┐
    │ Add Sale│      │  Dashboard  │    │ Reports │
    └─────────┘      └─────────────┘    └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                  ┌────────────────┐
                  │ SalesContext   │
                  │ (Global State) │
                  └────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌─────────┐      ┌──────────┐     ┌─────────────┐
    │AllSales │      │ Products │     │ localStorage│
    │(Array)  │      │ (Array)  │     │ (Single)    │
    └─────────┘      └──────────┘     └─────────────┘
        │
    ┌─────────────────────────────────┐
    │  Supabase Database              │
    │  (1 sales table)                │
    └─────────────────────────────────┘

PRICING: Fixed
    Mango: 25 Rs
    Pista: 30 Rs
    (Same for all sales)

ANALYTICS:
    ✓ All sales combined
    ✓ Single dashboard view
    ✗ No shop differentiation
```

---

## 🆕 New System (Multi-Shop)

```
┌─────────────────────────────────────────────────────────┐
│                  GANESH KULFI APP v2.0                  │
│           [🏪 Shop 1] [🏪 Shop 2] (Selector)            │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌─────────┐      ┌─────────────┐    ┌─────────┐
    │ Add Sale│      │  Dashboard  │    │ Reports │
    │(Shop ID)│      │ (Shop Filter)    │(Shop Sel)
    └─────────┘      └─────────────┘    └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                  ┌────────────────────┐
                  │ SalesContext v2    │
                  │ + currentShopId    │
                  │ + getProductsFor   │
                  │   Shop()           │
                  └────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │AllSales+     │  │Products:     │  │localStorage:│
    │shopId field  │  │Shop-aware    │  │Per-shop keys│
    └──────────────┘  │pricing logic │  └──────────────┘
                      └──────────────┘
        │
    ┌────────────────────────────────────┐
    │  Supabase Database v2              │
    │  sales (+ shop_id column)          │
    │  - Sales for Shop 1                │
    │  - Sales for Shop 2                │
    └────────────────────────────────────┘

PRICING: Dynamic
    Shop 1:
        Mango: 25 Rs
        Pista: 30 Rs
    Shop 2:
        Mango: 30 Rs (25+5)
        Pista: 35 Rs (30+5)

ANALYTICS:
    ✓ All sales separated by shop
    ✓ Independent dashboard per shop
    ✓ Shop-specific profit calculations
    ✓ Compare shops capability (future)
```

---

## 🔄 Data Flow Comparison

### Current Flow: Add Sale → Record
```
User Input
    ↓
Select Product (Mango - 25 Rs)
    ↓
Add Quantity (5 units)
    ↓
Submit
    ↓
Create Sale Record:
{
  id: 'xxx',
  date: '2026-05-15',
  productId: 'mango',
  quantity: 5,
  unitPrice: 25,          ← Fixed price
  unitProfit: 9,
  customer: 'Walk-in',
  city: 'Pune'
}
    ↓
Save to localStorage + Supabase
    ↓
Dashboard calculates metrics
```

### New Flow: Add Sale → Record with Shop Context
```
User Input
    ↓
SELECT SHOP (Shop 1 or Shop 2)     ← NEW STEP
    ↓
Select Product (Mango - 25 Rs or 30 Rs depending on shop)
    ↓
Add Quantity (5 units)
    ↓
Submit
    ↓
Create Sale Record:

Shop 1:                            Shop 2:
{                                  {
  id: 'xxx',                         id: 'yyy',
  date: '2026-05-15',                date: '2026-05-15',
  productId: 'mango',                productId: 'mango',
  quantity: 5,                       quantity: 5,
  unitPrice: 25,                     unitPrice: 30,        ← Adjusted
  unitProfit: 9,                     unitProfit: 9,
  customer: 'Walk-in',               customer: 'Walk-in',
  city: 'Pune',                      city: 'Pune',
  shopId: 'shop-1'  ← NEW FIELD      shopId: 'shop-2'  ← NEW FIELD
}                                  }
    ↓
Save to shop-specific localStorage + Supabase (with shop_id)
    ↓
Dashboard filters by current shop and calculates metrics
```

---

## 📁 File Structure Changes

### No New Files Required (Core)
```
src/
├── data/
│   └── products.js          ← UPDATE: Add shop definitions & getProductsForShop()
├── context/
│   └── SalesContext.jsx      ← UPDATE: Add currentShopId state & methods
├── components/
│   ├── ShopSelector.jsx      ← NEW: Shop selection UI
│   ├── Navbar.jsx            ← UPDATE: Integrate ShopSelector
│   └── ...existing
├── pages/
│   ├── Dashboard.jsx         ← UPDATE: Filter by currentShopId
│   ├── AddSale.jsx           ← UPDATE: Show shop context
│   ├── FlavorAnalysis.jsx    ← UPDATE: Filter by currentShopId
│   ├── History.jsx           ← UPDATE: Show shop column
│   ├── Records.jsx           ← UPDATE: Show shop column
│   ├── Reports.jsx           ← UPDATE: Filter & export shop info
│   └── ...existing
├── utils/
│   └── excelReport.js        ← UPDATE: Include shop in exports
└── ...existing
```

---

## 🗄️ Database Schema Changes

### Before
```sql
sales:
├── id (uuid)
├── date (text)
├── product_id (text)
├── quantity (integer)
├── unit_price (numeric)
├── unit_profit (numeric)
├── unit_cost (numeric)
├── customer (text)
├── city (text)
└── created_at (timestamp)
```

### After
```sql
sales:
├── id (uuid)
├── date (text)
├── product_id (text)
├── quantity (integer)
├── unit_price (numeric)
├── unit_profit (numeric)
├── unit_cost (numeric)
├── customer (text)
├── city (text)
├── shop_id (text) ← NEW FIELD (default: 'shop-1')
└── created_at (timestamp)
```

---

## 📈 Impact on Key Features

### Add Sale Page
```
BEFORE:
┌─────────────────────┐
│ Product Selection   │ → All products, single price per product
│ Quantity Input      │
│ Submit Button       │
└─────────────────────┘

AFTER:
┌─────────────────────┐
│ SHOP SELECTOR ← NEW │ → Choose Shop 1 or Shop 2
├─────────────────────┤
│ Product Selection   │ → Same products, different prices per shop
│ Quantity Input      │
│ Submit Button       │
└─────────────────────┘
```

### Dashboard Page
```
BEFORE:
┌──────────────────────────┐
│ Total Sales: ₹5,000      │
│ Revenue Chart (All Time) │
│ Top 5 Flavors (All)      │
└──────────────────────────┘

AFTER:
┌────────────────────────────┐
│ [Shop 1] [Shop 2] (Selector)
├────────────────────────────┤
│ Shop 1 Sales: ₹2,500       │ if Shop 1 selected
│ Revenue Chart (Shop 1)     │ or
│ Top 5 Flavors (Shop 1)     │ Shop 2 Sales: ₹2,800
└────────────────────────────┘    (with different pricing)
```

### History/Records Page
```
BEFORE:
┌──────────────────────────────┐
│ Date    │ Product │ Qty │ Amt │
├──────────────────────────────┤
│ 2026-05 │ Mango   │ 10  │ 250 │
│ 2026-04 │ Pista   │ 5   │ 150 │
└──────────────────────────────┘

AFTER:
┌───────────────────────────────────────┐
│ [Filter by Shop] [All]                │
├───────────────────────────────────────┤
│ Date    │ Shop  │ Product │ Qty │ Amt │
├───────────────────────────────────────┤
│ 2026-05 │ Shop1 │ Mango   │ 10  │ 250 │
│ 2026-04 │ Shop2 │ Pista   │ 5   │ 175 │
└───────────────────────────────────────┘
          ↑ NEW COLUMN
```

---

## 💰 Pricing Impact Example

### Sample Sales Entry
```
Product: Mango Kulfi (normally 25 Rs)

Shop 1 Sale:                  Shop 2 Sale:
┌──────────────────┐         ┌──────────────────┐
│ Quantity: 10     │         │ Quantity: 10     │
│ Unit Price: 25   │         │ Unit Price: 30   │ ← AUTO ADJUSTED
│ Total: 250 Rs    │         │ Total: 300 Rs    │
│ Profit/unit: 9   │         │ Profit/unit: 9   │
│ Total Profit:90  │         │ Total Profit:90  │
└──────────────────┘         └──────────────────┘

Margin: 36% for both        Additional Revenue: +50 Rs (20%)
```

---

## 🎯 Key Behavioral Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Product Prices** | Single fixed price | Dynamic per shop |
| **Add Sale** | Direct recording | Choose shop first |
| **Dashboard** | All sales mixed | Shop-specific view |
| **Analytics** | Combined metrics | Per-shop metrics |
| **Storage** | Single localStorage key | Shop-specific keys |
| **Database** | No shop distinction | shop_id on all records |
| **Reporting** | Single report | Shop-specific reports |
| **Price Updates** | Update in PRODUCTS | Can vary per shop |

---

## ✅ Backward Compatibility Strategy

```javascript
// All existing sales without shop_id treated as 'shop-1'
const effectiveShopId = sale.shopId || 'shop-1'

// localStorage migration
const oldData = localStorage.getItem('kulfi-sales-records-v2')
if (oldData) {
  const parsed = JSON.parse(oldData)
  // Save to shop-1 specific key
  localStorage.setItem('kulfi-sales-records-v2-shop-1', JSON.stringify(parsed))
  // Keep old key for safety
}

// Supabase migration
// UPDATE sales SET shop_id = 'shop-1' WHERE shop_id IS NULL
```

---

## 📊 Expected Results After Implementation

### Metrics Tracking
**Shop 1** (Original):
- Revenue: Original calculation
- Profit: Original margins
- Units: All tracked

**Shop 2** (Premium):
- Revenue: 15-20% higher (due to 5 Rs increase per item)
- Profit: Same margins, higher absolute profit
- Units: Tracked separately

### Dashboard Insights
- **Compare View**: Can see Shop 1 vs Shop 2 side-by-side
- **Trend Analysis**: Identify which shop is more profitable
- **Flavor Performance**: Same flavors, different pricing tiers
- **Growth Tracking**: Month-over-month per shop

---

**Summary**: The change is architectural but focused — add shop context to existing data flow, with dynamic pricing based on shop selection.
