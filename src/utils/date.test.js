import { describe, expect, it } from 'vitest';
import { getLocalISODate, toLocalDateKey } from './date';

describe('date.js - Date Utilities & Key Normalization', () => {
  describe('getLocalISODate', () => {
    it('formats Date object to YYYY-MM-DD format based on local calendar', () => {
      const d = new Date(2026, 9, 5); // October 5, 2026 (month is 0-indexed)
      expect(getLocalISODate(d)).toBe('2026-10-05');
    });

    it('pads single-digit months and days with leading zeros', () => {
      const d = new Date(2026, 0, 3); // January 3, 2026
      expect(getLocalISODate(d)).toBe('2026-01-03');
    });

    it('handles string date inputs without crashing', () => {
      const iso = getLocalISODate('2026-05-15T10:30:00.000Z');
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('toLocalDateKey', () => {
    it('preserves clean YYYY-MM-DD string as-is without timezone shifting', () => {
      expect(toLocalDateKey('2026-10-05')).toBe('2026-10-05');
      expect(toLocalDateKey('  2026-03-15  ')).toBe('2026-03-15');
    });

    it('converts full ISO timestamps to local date key', () => {
      const key = toLocalDateKey('2026-10-03T18:30:00.000Z');
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('converts Date instances to local date key', () => {
      const d = new Date(2026, 11, 25); // Dec 25, 2026
      expect(toLocalDateKey(d)).toBe('2026-12-25');
    });

    it('returns empty string for null, undefined, or empty values', () => {
      expect(toLocalDateKey(null)).toBe('');
      expect(toLocalDateKey(undefined)).toBe('');
      expect(toLocalDateKey('')).toBe('');
      expect(toLocalDateKey('   ')).toBe('');
    });

    it('returns empty string for invalid date strings', () => {
      expect(toLocalDateKey('invalid-date-string')).toBe('');
      expect(toLocalDateKey('not_a_date')).toBe('');
    });
  });
});
