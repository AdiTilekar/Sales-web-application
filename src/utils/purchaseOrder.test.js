import { describe, expect, it } from 'vitest';
import {
  COMPANY_NAME,
  createPOData,
  formatCurrency,
  formatWhatsAppPOMessage,
  generatePONumber,
  getWhatsAppShareUrl,
} from './purchaseOrder';

describe('purchaseOrder.js - Purchase Order Totals & Utilities', () => {
  describe('formatCurrency', () => {
    it('formats values into Indian Rupee strings', () => {
      expect(formatCurrency(111200)).toBe('₹1,11,200');
      expect(formatCurrency(17)).toBe('₹17');
      expect(formatCurrency(0)).toBe('₹0');
      expect(formatCurrency(null)).toBe('₹0');
    });
  });

  describe('generatePONumber', () => {
    it('generates sequential PO identifier with today date and padded sequence', () => {
      const po1 = generatePONumber(0);
      const po2 = generatePONumber(1);
      const po10 = generatePONumber(9);

      expect(po1).toMatch(/^PO-\d{8}-01$/);
      expect(po2).toMatch(/^PO-\d{8}-02$/);
      expect(po10).toMatch(/^PO-\d{8}-10$/);
    });
  });

  describe('createPOData & Totals Calculation', () => {
    it('constructs PO object with exact items, calculated totals, and defaults', () => {
      const mockItems = [
        { id: 'rabdi', name: 'Rabdi', quantity: 1800, unitPrice: 17, lineTotal: 30600 },
        { id: 'small-rabdi', name: 'Small Rabdi Kulfi', quantity: 2500, unitPrice: 9, lineTotal: 22500 },
        { id: 'dry-fruit', name: 'Dry Fruit', quantity: 300, unitPrice: 25, lineTotal: 7500 },
        { id: 'pista', name: 'Pista', quantity: 250, unitPrice: 22, lineTotal: 5500 },
      ];

      const totalUnits = mockItems.reduce((acc, i) => acc + i.quantity, 0); // 4850
      const totalAmount = mockItems.reduce((acc, i) => acc + i.lineTotal, 0); // 66100

      const po = createPOData({
        orderCount: 2,
        shopId: 'shop-1',
        branchName: 'Chikhali Branch',
        poDate: '2026-10-03',
        expectedDelivery: '2026-10-04',
        supplierName: 'Shree Ganesh Kulfi Factory',
        supplierPhone: '9876543210',
        notes: 'Morning dispatch',
        items: mockItems,
        totalUnits,
        totalAmount,
        status: 'Created',
      });

      expect(po.poNumber).toMatch(/^PO-\d{8}-03$/);
      expect(po.branchName).toBe('Chikhali Branch');
      expect(po.supplierName).toBe('Shree Ganesh Kulfi Factory');
      expect(po.supplierPhone).toBe('9876543210');
      expect(po.notes).toBe('Morning dispatch');
      expect(po.totalUnits).toBe(4850);
      expect(po.totalAmount).toBe(66100);
      expect(po.signedBy).toBe(COMPANY_NAME);
      expect(po.items).toHaveLength(4);
      expect(po.items[0]).toEqual({
        id: 'rabdi',
        name: 'Rabdi',
        quantity: 1800,
        unitPrice: 17,
        lineTotal: 30600,
      });
    });

    it('handles empty items and sets defaults safely', () => {
      const po = createPOData({
        orderCount: 0,
        shopId: 'shop-1',
        branchName: 'Chikhali Branch',
      });

      expect(po.totalUnits).toBe(0);
      expect(po.totalAmount).toBe(0);
      expect(po.items).toEqual([]);
      expect(po.status).toBe('Created');
      expect(po.supplierName).toBe('Factory Warehouse');
    });
  });

  describe('formatWhatsAppPOMessage', () => {
    it('builds structured WhatsApp message containing branch, line items, and totals', () => {
      const po = {
        poNumber: 'PO-20261003-01',
        branchName: 'Chikhali Branch',
        date: '2026-10-03',
        expectedDelivery: '2026-10-04',
        supplierName: 'Shree Ganesh Kulfi Factory',
        items: [
          { name: 'Rabdi', quantity: 1800, unitPrice: 17 },
          { name: 'Pista', quantity: 250, unitPrice: 22 },
        ],
        totalUnits: 2050,
        totalAmount: 36100,
        notes: 'Cold storage pack',
      };

      const msg = formatWhatsAppPOMessage(po);

      expect(msg).toContain('SHREE GANESH KULFI');
      expect(msg).toContain('PO-20261003-01');
      expect(msg).toContain('Chikhali Branch');
      expect(msg).toContain('*Rabdi*: 1800 units @ ₹17 = *₹30,600*');
      expect(msg).toContain('*Pista*: 250 units @ ₹22 = *₹5,500*');
      expect(msg).toContain('TOTAL QUANTITY:* *2,050 units*');
      expect(msg).toContain('TOTAL ESTIMATED AMOUNT:* *₹36,100*');
      expect(msg).toContain('Notes / Instructions:* Cold storage pack');
      expect(msg).toContain(COMPANY_NAME);
    });
  });

  describe('getWhatsAppShareUrl', () => {
    it('prepends 91 country code for 10-digit Indian phone numbers', () => {
      const url = getWhatsAppShareUrl('9876543210', 'Test Message');
      expect(url).toContain('https://api.whatsapp.com/send?phone=919876543210&text=Test%20Message');
    });

    it('handles phone numbers with special characters or spaces', () => {
      const url = getWhatsAppShareUrl('+91 98765 43210', 'Hello');
      expect(url).toContain('phone=919876543210');
    });

    it('creates generic share url when no phone number is provided', () => {
      const url = getWhatsAppShareUrl('', 'Order Details');
      expect(url).toBe('https://api.whatsapp.com/send?text=Order%20Details');
    });
  });
});
