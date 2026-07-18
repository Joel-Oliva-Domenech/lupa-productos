import { describe, expect, it } from 'vitest';
import { cleanBarcode, hasValidGtinChecksum, validateBarcode } from './barcode';

describe('barcode utilities', () => {
  it('cleans spaces and non-numeric separators', () => {
    expect(cleanBarcode('8 412-345 678 905')).toBe('8412345678905');
  });

  it('validates a supported GTIN checksum', () => {
    expect(hasValidGtinChecksum('8412345678905')).toBe(true);
    expect(validateBarcode('8412345678905')).toMatchObject({
      valid: true,
      code: '8412345678905',
    });
  });

  it('rejects a mistyped or incomplete GTIN', () => {
    expect(validateBarcode('8412345678904').valid).toBe(false);
    expect(validateBarcode('123').valid).toBe(false);
  });
});
