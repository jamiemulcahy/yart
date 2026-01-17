import { describe, it, expect } from 'vitest';
import {
  isValidString,
  isValidId,
  isValidText,
  isValidName,
  isValidPosition,
  getCorsOrigin,
  MAX_TEXT_LENGTH,
  MAX_NAME_LENGTH,
} from './validation';

describe('Validation Helpers', () => {
  describe('isValidString', () => {
    it('returns true for valid strings', () => {
      expect(isValidString('hello')).toBe(true);
      expect(isValidString('')).toBe(true);
    });

    it('returns false for non-strings', () => {
      expect(isValidString(123)).toBe(false);
      expect(isValidString(null)).toBe(false);
      expect(isValidString(undefined)).toBe(false);
      expect(isValidString({})).toBe(false);
      expect(isValidString([])).toBe(false);
    });
  });

  describe('isValidId', () => {
    it('returns true for valid IDs', () => {
      expect(isValidId('abc-123')).toBe(true);
      expect(isValidId('a')).toBe(true);
      expect(isValidId('x'.repeat(100))).toBe(true);
    });

    it('returns false for invalid IDs', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('x'.repeat(101))).toBe(false);
      expect(isValidId(123)).toBe(false);
      expect(isValidId(null)).toBe(false);
    });
  });

  describe('isValidText', () => {
    it('returns true for valid text', () => {
      expect(isValidText('hello world')).toBe(true);
      expect(isValidText('a')).toBe(true);
      expect(isValidText('x'.repeat(MAX_TEXT_LENGTH))).toBe(true);
    });

    it('returns false for invalid text', () => {
      expect(isValidText('')).toBe(false);
      expect(isValidText('   ')).toBe(false);
      expect(isValidText('x'.repeat(MAX_TEXT_LENGTH + 1))).toBe(false);
      expect(isValidText(123)).toBe(false);
      expect(isValidText(null)).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('returns true for valid names', () => {
      expect(isValidName('Column Name')).toBe(true);
      expect(isValidName('a')).toBe(true);
      expect(isValidName('x'.repeat(MAX_NAME_LENGTH))).toBe(true);
    });

    it('returns false for invalid names', () => {
      expect(isValidName('')).toBe(false);
      expect(isValidName('   ')).toBe(false);
      expect(isValidName('x'.repeat(MAX_NAME_LENGTH + 1))).toBe(false);
      expect(isValidName(123)).toBe(false);
      expect(isValidName(null)).toBe(false);
    });
  });

  describe('isValidPosition', () => {
    it('returns true for valid positions', () => {
      expect(isValidPosition(0)).toBe(true);
      expect(isValidPosition(1)).toBe(true);
      expect(isValidPosition(100)).toBe(true);
    });

    it('returns false for invalid positions', () => {
      expect(isValidPosition(-1)).toBe(false);
      expect(isValidPosition(1.5)).toBe(false);
      expect(isValidPosition('0')).toBe(false);
      expect(isValidPosition(null)).toBe(false);
      expect(isValidPosition(undefined)).toBe(false);
    });
  });
});

describe('CORS', () => {
  describe('getCorsOrigin', () => {
    it('returns * when allowed origins is *', () => {
      expect(getCorsOrigin('https://example.com', '*')).toBe('*');
      expect(getCorsOrigin(null, '*')).toBe('*');
    });

    it('returns empty string when no request origin provided', () => {
      expect(getCorsOrigin(null, 'https://example.com')).toBe('');
      expect(getCorsOrigin('', 'https://example.com')).toBe('');
    });

    it('returns origin when it matches allowed list', () => {
      expect(getCorsOrigin('https://example.com', 'https://example.com')).toBe(
        'https://example.com'
      );
      expect(getCorsOrigin('https://example.com', 'https://other.com,https://example.com')).toBe(
        'https://example.com'
      );
    });

    it('returns empty string when origin not in allowed list', () => {
      expect(getCorsOrigin('https://evil.com', 'https://example.com')).toBe('');
      expect(getCorsOrigin('https://evil.com', 'https://example.com,https://other.com')).toBe('');
    });

    it('handles whitespace in allowed origins list', () => {
      expect(getCorsOrigin('https://example.com', 'https://other.com, https://example.com')).toBe(
        'https://example.com'
      );
    });
  });
});
