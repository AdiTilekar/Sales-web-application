import { describe, expect, it } from 'vitest';
import { aggregateFinance, getProfitMarginPercent, getSaleFinance } from './finance';

describe('finance.js - Sales & Margin Calculations', () => {
  const mockProduct = {
    id: 'rabdi',
    name: 'Rabdi',
    price: 30,
    profitPerUnit: 13,
    costPrice: 17,
  };

  describe('getSaleFinance', () => {
    it('calculates finance correctly using product defaults', () => {
      const sale = { quantity: 10 };
      const finance = getSaleFinance(sale, mockProduct);

      expect(finance.quantity).toBe(10);
      expect(finance.price).toBe(30);
      expect(finance.profitPerUnit).toBe(13);
      expect(finance.unitCost).toBe(17);
      expect(finance.revenue).toBe(300);
      expect(finance.cost).toBe(170);
      expect(finance.profit).toBe(130);
    });

    it('respects sale-level custom unitPrice and unitProfit overrides', () => {
      const sale = {
        quantity: 5,
        unitPrice: 35, // e.g. Akurdi branch price
        unitProfit: 15,
        unitCost: 20,
      };
      const finance = getSaleFinance(sale, mockProduct);

      expect(finance.price).toBe(35);
      expect(finance.profitPerUnit).toBe(15);
      expect(finance.unitCost).toBe(20);
      expect(finance.revenue).toBe(175);
      expect(finance.cost).toBe(100);
      expect(finance.profit).toBe(75);
    });

    it('handles zero quantity and missing product safely without NaN', () => {
      const sale = { quantity: 0 };
      const finance = getSaleFinance(sale, null);

      expect(finance.quantity).toBe(0);
      expect(finance.price).toBe(0);
      expect(finance.profitPerUnit).toBe(0);
      expect(finance.unitCost).toBe(0);
      expect(finance.revenue).toBe(0);
      expect(finance.cost).toBe(0);
      expect(finance.profit).toBe(0);
    });

    it('handles fallback unitCost calculation when unitCost is not provided', () => {
      const sale = { quantity: 4, unitPrice: 40, unitProfit: 12 };
      const finance = getSaleFinance(sale, null);

      expect(finance.unitCost).toBe(28); // 40 - 12
      expect(finance.revenue).toBe(160);
      expect(finance.cost).toBe(112);
      expect(finance.profit).toBe(48);
    });
  });

  describe('aggregateFinance', () => {
    const productMap = {
      rabdi: { id: 'rabdi', name: 'Rabdi', price: 30, profitPerUnit: 13 },
      'small-rabdi': { id: 'small-rabdi', name: 'Small Rabdi Kulfi', price: 15, profitPerUnit: 6 },
    };

    it('correctly aggregates multiple sales across different products', () => {
      const sales = [
        { productId: 'rabdi', quantity: 10 },        // rev 300, cost 170, prof 130
        { productId: 'small-rabdi', quantity: 20 },  // rev 300, cost 180, prof 120
      ];

      const agg = aggregateFinance(sales, productMap);

      expect(agg.units).toBe(30);
      expect(agg.revenue).toBe(600);
      expect(agg.cost).toBe(350);
      expect(agg.profit).toBe(250);
    });

    it('returns zeroes for an empty sales array', () => {
      const agg = aggregateFinance([], productMap);

      expect(agg.units).toBe(0);
      expect(agg.revenue).toBe(0);
      expect(agg.cost).toBe(0);
      expect(agg.profit).toBe(0);
    });
  });

  describe('getProfitMarginPercent', () => {
    it('calculates accurate profit margin percentage', () => {
      const margin = getProfitMarginPercent(250, 1000);
      expect(margin).toBe(25);
    });

    it('returns 0 when revenue is 0 or invalid to avoid division by zero', () => {
      expect(getProfitMarginPercent(0, 0)).toBe(0);
      expect(getProfitMarginPercent(100, 0)).toBe(0);
      expect(getProfitMarginPercent(100, null)).toBe(0);
    });
  });
});
