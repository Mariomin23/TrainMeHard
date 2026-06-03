import { describe, it, expect } from 'vitest';
import { eurToCents, centsToEur, formatPrice } from '../../src/utils/priceFormatter.util.js';

describe('priceFormatter.util', () => {
  it('eurToCents convierte euros a centavos', () => {
    expect(eurToCents(10)).toBe(1000);
    expect(eurToCents(9.99)).toBe(999);
    expect(eurToCents(0.5)).toBe(50);
  });

  it('centsToEur convierte centavos a euros con 2 decimales', () => {
    expect(centsToEur(1000)).toBe(10);
    expect(centsToEur(999)).toBe(9.99);
  });

  it('formatPrice formatea como moneda EUR', () => {
    const result = formatPrice(10);
    expect(result).toContain('10');
    expect(result).toContain('€');
  });
});
