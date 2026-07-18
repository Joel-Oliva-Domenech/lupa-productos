import { describe, expect, it } from 'vitest';
import { DEMO_PRODUCT_RAW } from '../data/demoProduct';
import {
  buildEvidence,
  getKnownAndMissing,
  getPreferenceMatches,
  normalizeProduct,
} from './productAnalysis';

describe('product analysis', () => {
  const product = normalizeProduct(DEMO_PRODUCT_RAW, { source: 'demo' });

  it('normalizes fields without creating a universal score', () => {
    expect(product.name).toBe('Bebida de avena');
    expect(product.confidence.score).toBeGreaterThan(70);
    expect(product).not.toHaveProperty('healthScore');
  });

  it('keeps evidence and missing data explicit', () => {
    const evidence = buildEvidence(product);
    expect(evidence.map((item) => item.id)).toEqual([
      'sugar',
      'processing',
      'composition',
    ]);
    expect(getKnownAndMissing(product).known).toContain('Lista de ingredientes');
  });

  it('matches personal terms literally and locally', () => {
    expect(getPreferenceMatches(product, ['leche', 'avena'])).toEqual(['avena']);
  });
});
