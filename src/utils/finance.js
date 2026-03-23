export const getSaleFinance = (sale, product) => {
  const quantity = Number(sale?.quantity || 0)
  const fallbackPrice = Number(product?.price || 0)
  const fallbackProfitPerUnit = Number(product?.profitPerUnit || 0)

  const price = Number(sale?.unitPrice ?? fallbackPrice)
  const profitPerUnit = Number(sale?.unitProfit ?? fallbackProfitPerUnit)
  const unitCost = Number(sale?.unitCost ?? Math.max(0, price - profitPerUnit))

  const revenue = quantity * price
  const cost = quantity * unitCost
  const profit = revenue - cost

  return { quantity, price, profitPerUnit, unitCost, revenue, profit, cost }
}

export const aggregateFinance = (sales, productMap) => {
  return sales.reduce(
    (acc, sale) => {
      const product = productMap[sale.productId]
      const finance = getSaleFinance(sale, product)

      acc.units += finance.quantity
      acc.revenue += finance.revenue
      acc.profit += finance.profit
      acc.cost += finance.cost
      return acc
    },
    { units: 0, revenue: 0, profit: 0, cost: 0 },
  )
}

export const getProfitMarginPercent = (profit, revenue) => {
  if (!revenue) return 0
  return (profit / revenue) * 100
}
