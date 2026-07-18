import { cacheProduct, getCachedProduct } from './storage';

const API_ROOT = 'https://world.openfoodfacts.org/api/v3/product';
const FIELDS = [
  'code',
  'product_name',
  'product_name_es',
  'generic_name',
  'generic_name_es',
  'brands',
  'quantity',
  'image_front_url',
  'image_url',
  'ingredients_text',
  'ingredients_text_es',
  'allergens_tags',
  'additives_tags',
  'additives_n',
  'nova_group',
  'nutriments',
  'categories_tags',
  'labels_tags',
  'data_quality_errors_tags',
  'data_quality_warnings_tags',
  'last_modified_t',
].join(',');

export class ProductNotFoundError extends Error {
  constructor(code) {
    super('No encontramos el producto ' + code + ' en Open Food Facts.');
    this.name = 'ProductNotFoundError';
  }
}

export async function fetchProduct(code, { signal } = {}) {
  const cached = getCachedProduct(code);
  try {
    const url =
      API_ROOT +
      '/' +
      encodeURIComponent(code) +
      '.json?fields=' +
      encodeURIComponent(FIELDS) +
      '&lc=es';
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) throw new ProductNotFoundError(code);
    if (!response.ok) {
      throw new Error('La fuente respondió con el estado ' + response.status + '.');
    }

    const payload = await response.json();
    if (!payload.product) throw new ProductNotFoundError(code);
    cacheProduct(code, payload.product);
    return { raw: payload.product, offline: false };
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof ProductNotFoundError) throw error;
    if (cached?.product) return { raw: cached.product, offline: true };
    throw new Error(
      'No se pudo consultar la fuente. Revisa la conexión e inténtalo de nuevo.',
    );
  }
}
