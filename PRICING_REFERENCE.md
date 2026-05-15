# Pricing Reference & Shop Comparison

## 💰 Complete Price List

### All 17 Products with Shop-Specific Pricing

| # | Product | Category | Shop 1 | Shop 2 | Diff | Margin Change |
|---|---------|----------|--------|--------|------|----------------|
| 1 | Mango | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 2 | Rabdi | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 3 | Small Rabdi Kulfi | 15 Rs | ₹15 | ₹20 | +5 | +33% Revenue |
| 4 | Dry Fruit | 30 Rs | ₹30 | ₹35 | +5 | +16.7% Revenue |
| 5 | Pista | 30 Rs | ₹30 | ₹35 | +5 | +16.7% Revenue |
| 6 | Chocolate | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 7 | Paan | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 8 | Strawberry | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 9 | Sitafal | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 10 | Gulkand | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 11 | Pineapple | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 12 | Red Peru | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 13 | Jamun | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 14 | Chikoo | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 15 | Anjeer | 30 Rs | ₹30 | ₹35 | +5 | +16.7% Revenue |
| 16 | Mava Kulfi | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |
| 17 | Butterscotch | 25 Rs | ₹25 | ₹30 | +5 | +20% Revenue |

---

## 📊 Category Breakdown

### 25 Rs Products (14 items)
| Product | Shop 1 | Shop 2 | Increase |
|---------|--------|--------|----------|
| Mango | ₹25 | ₹30 | ₹5 (+20%) |
| Rabdi | ₹25 | ₹30 | ₹5 (+20%) |
| Chocolate | ₹25 | ₹30 | ₹5 (+20%) |
| Paan | ₹25 | ₹30 | ₹5 (+20%) |
| Strawberry | ₹25 | ₹30 | ₹5 (+20%) |
| Sitafal | ₹25 | ₹30 | ₹5 (+20%) |
| Gulkand | ₹25 | ₹30 | ₹5 (+20%) |
| Pineapple | ₹25 | ₹30 | ₹5 (+20%) |
| Red Peru | ₹25 | ₹30 | ₹5 (+20%) |
| Jamun | ₹25 | ₹30 | ₹5 (+20%) |
| Chikoo | ₹25 | ₹30 | ₹5 (+20%) |
| Mava Kulfi | ₹25 | ₹30 | ₹5 (+20%) |
| Butterscotch | ₹25 | ₹30 | ₹5 (+20%) |
| | | **Total Items** | **13** |

### 30 Rs Products (3 items)
| Product | Shop 1 | Shop 2 | Increase |
|---------|--------|--------|----------|
| Dry Fruit | ₹30 | ₹35 | ₹5 (+16.7%) |
| Pista | ₹30 | ₹35 | ₹5 (+16.7%) |
| Anjeer | ₹30 | ₹35 | ₹5 (+16.7%) |
| | | **Total Items** | **3** |

### 15 Rs Products (1 item)
| Product | Shop 1 | Shop 2 | Increase |
|---------|--------|--------|----------|
| Small Rabdi Kulfi | ₹15 | ₹20 | ₹5 (+33%) |
| | | **Total Items** | **1** |

**TOTAL UNIQUE PRODUCTS: 17**

---

## 💼 Pricing Strategy Implementation

### Logic for Shop 2 Pricing

```javascript
// Method 1: Mapping by original price
const SHOP_2_PRICE_MULTIPLIER = {
  15: 20,  // +5 Rs
  25: 30,  // +5 Rs
  30: 35   // +5 Rs
}

// Method 2: Formula-based (simpler)
const shop2Price = shop1Price + 5

// RECOMMENDATION: Use Method 2 (Formula-based)
// - Simpler logic
- Future-proof (if base prices change)
// - Easier to adjust multiplier later
```

---

## 📈 Revenue Impact Analysis

### Scenario: Sample Week Sales Distribution

Assuming equal sales across both shops:

#### Sales Volume Assumption
- 5 units of each product category per shop per day
- 7 days = 1 week
- Total: 35 units per category per shop per week

#### Shop 1 Revenue (Original Pricing)
```
25 Rs Products (13 items):
  5 units/day × 7 days × ₹25 = ₹875/week per item
  ₹875 × 13 items = ₹11,375

30 Rs Products (3 items):
  5 units/day × 7 days × ₹30 = ₹1,050/week per item
  ₹1,050 × 3 items = ₹3,150

15 Rs Products (1 item):
  5 units/day × 7 days × ₹15 = ₹525

SHOP 1 WEEKLY TOTAL: ₹11,375 + ₹3,150 + ₹525 = ₹15,050
```

#### Shop 2 Revenue (Premium Pricing)
```
30 Rs Products (13 items from 25 Rs):
  5 units/day × 7 days × ₹30 = ₹1,050/week per item
  ₹1,050 × 13 items = ₹13,650

35 Rs Products (3 items from 30 Rs):
  5 units/day × 7 days × ₹35 = ₹1,225/week per item
  ₹1,225 × 3 items = ₹3,675

20 Rs Products (1 item from 15 Rs):
  5 units/day × 7 days × ₹20 = ₹700

SHOP 2 WEEKLY TOTAL: ₹13,650 + ₹3,675 + ₹700 = ₹18,025
```

#### Comparative Analysis
```
Shop 1 Revenue:        ₹15,050/week
Shop 2 Revenue:        ₹18,025/week
Difference:            ₹2,975/week
Percentage Increase:   19.75% ↑

MONTHLY IMPACT (4 weeks):
Shop 1:               ₹60,200
Shop 2:               ₹72,100
Additional Revenue:   ₹11,900/month

YEARLY IMPACT (52 weeks):
Shop 1:               ₹782,600
Shop 2:               ₹937,300
Additional Revenue:   ₹154,700/year
```

---

## 🎯 Profit Margin Comparison

### Assuming Same Cost Structure

**Profit per Unit (Assumed - adjust as needed):**
- 25 Rs items: ₹9 profit = 36% margin
- 30 Rs items: ₹9 profit = 30% margin
- 15 Rs items: ₹7 profit = 46.7% margin

#### Shop 1 Profit Margins
```
25 Rs items: 36% margin (₹9 per unit)
30 Rs items: 30% margin (₹9 per unit)
15 Rs items: 46.7% margin (₹7 per unit)

Average margin: ~35%
Weekly profit: ₹15,050 × 35% = ₹5,267.50
```

#### Shop 2 Profit Margins (If costs same, prices raised)
```
30 Rs items: 30% margin (₹9 per unit) - MARGIN SAME
35 Rs items: 25.7% margin (₹9 per unit) - MARGIN LOWER
20 Rs items: 35% margin (₹7 per unit) - MARGIN HIGHER

Average margin: ~30%
Weekly profit: ₹18,025 × 30% = ₹5,407.50

NOTE: Absolute profit increased, but margin % decreased
due to higher pricing without increased costs.
This is expected premium tier strategy.
```

---

## 🔄 Price Mapping Code Reference

### Implementation Option 1: Explicit Mapping
```javascript
const SHOP_2_PRICES = {
  'mango': 30,
  'rabdi': 30,
  'small-rabdi': 20,
  'dry-fruit': 35,
  'pista': 35,
  'chocolate': 30,
  'paan': 30,
  'strawberry': 30,
  'sitafal': 30,
  'gulkand': 30,
  'pineapple': 30,
  'red-peru': 30,
  'jamun': 30,
  'chikoo': 30,
  'anjeer': 35,
  'mava': 30,
  'butterscotch': 30
}

export function getProductsForShop(shopId) {
  if (shopId === 'shop-1') return PRODUCTS
  
  return PRODUCTS.map(product => ({
    ...product,
    price: SHOP_2_PRICES[product.id] || product.price
  }))
}
```

### Implementation Option 2: Formula-Based (Recommended)
```javascript
const SHOP_2_PRICE_ADJUSTMENT = 5 // Rs

export function getProductsForShop(shopId) {
  if (shopId === 'shop-1') return PRODUCTS
  
  return PRODUCTS.map(product => ({
    ...product,
    price: product.price + SHOP_2_PRICE_ADJUSTMENT
  }))
}
```

**Why Option 2 is better:**
- Simpler code (1 line vs 17 entries)
- Consistent across all products
- Easier to modify adjustment later
- Scalable to future shops
- Reduces maintenance burden

---

## 📋 Configuration for Different Scenarios

### Future Expansion: 3rd Shop (Example)

```javascript
export const SHOPS = {
  'shop-1': { name: 'Shop 1', priceAdjustment: 0 },
  'shop-2': { name: 'Shop 2', priceAdjustment: +5 },
  'shop-3': { name: 'Shop 3', priceAdjustment: -3 } // Discount/Budget shop
}

export function getProductsForShop(shopId) {
  const shop = SHOPS[shopId]
  return PRODUCTS.map(product => ({
    ...product,
    price: product.price + (shop?.priceAdjustment || 0)
  }))
}
```

---

## 🧮 Quick Reference Cheat Sheet

### Price Lookup Table

**If customer asks: "How much is Mango in Shop 2?"**
→ Answer: ₹30 (was ₹25, +5 Rs)

**If customer asks: "How much is Pista in Shop 1?"**
→ Answer: ₹30 (unchanged)

**Price Rule of Thumb:**
```
Shop 1: Use base price from PRODUCTS array
Shop 2: Add ₹5 to base price

Examples:
- Base 25 Rs → Shop 2: 30 Rs
- Base 30 Rs → Shop 2: 35 Rs
- Base 15 Rs → Shop 2: 20 Rs
```

---

## 📊 Visual Price Comparison

```
PRICE RANGE DISTRIBUTION:

Shop 1 Pricing:
  15 Rs:  ████░░░░░ (1 product)    5.9%
  25 Rs:  ███████████████░░░ (13 products)  76.5%
  30 Rs:  ██░░░░░░░ (3 products)   17.6%
  
Shop 2 Pricing:
  20 Rs:  ████░░░░░ (1 product)    5.9%
  30 Rs:  ███████████████░░░ (13 products)  76.5%
  35 Rs:  ██░░░░░░░ (3 products)   17.6%

Revenue Impact: Shop 2 ≈ 20% higher (approx)
```

---

## 💡 Business Insights

### Why This Pricing Strategy?

**Shop 2 Premium Positioning:**
- Consistent ₹5 increase across all products
- Maintains margin percentages
- Easy for customers to understand
- Clear differentiation from Shop 1
- Supports brand positioning as premium franchise

**Financial Benefits:**
- Additional ₹2,975/week (~₹155k/year)
- Maintains profitability
- Scalable to more franchises
- Clear audit trail (5 Rs flat increase)

---

## ⚠️ Implementation Notes

### DO:
✅ Use formula-based pricing (+ 5 Rs)
✅ Store adjustment in shop definition
✅ Apply adjustment at display/save time
✅ Keep original product data unchanged
✅ Test with sample sales

### DON'T:
❌ Hardcode individual product prices
❌ Modify PRODUCTS array by shop
❌ Store price in sales record then calculate
❌ Create separate product arrays
❌ Manual price maintenance

---

## 🔐 Data Integrity Check

After implementation, verify:

```javascript
// Test in browser console:
const shop1Products = getProductsForShop('shop-1')
const shop2Products = getProductsForShop('shop-2')

// Should show ₹5 difference
console.log(shop1Products[0].price) // ₹25
console.log(shop2Products[0].price) // ₹30

// Verify no original data modified
console.log(PRODUCTS[0].price) // Still ₹25 (unchanged)
```

---

**Last Updated**: May 15, 2026
**Version**: 1.0
**Status**: Ready for Implementation
