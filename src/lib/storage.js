const KEYS = {
  history: 'lupa.history.v1',
  preferences: 'lupa.preferences.v1',
  productCache: 'lupa.product-cache.v1',
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full storage quota must not break the scanning flow.
  }
}

export function getHistory() {
  return read(KEYS.history, []);
}

export function rememberProduct(product) {
  const item = { ...product, viewedAt: Date.now() };
  const next = [item, ...getHistory().filter((entry) => entry.code !== product.code)].slice(0, 20);
  write(KEYS.history, next);
  return next;
}

export function clearHistory() {
  write(KEYS.history, []);
}

export function getPreferences() {
  return read(KEYS.preferences, { avoidTerms: [], reducedMotion: false });
}

export function savePreferences(preferences) {
  write(KEYS.preferences, preferences);
}

export function getCachedProduct(code) {
  return read(KEYS.productCache, {})[code] ?? null;
}

export function cacheProduct(code, product) {
  const cache = read(KEYS.productCache, {});
  cache[code] = { product, cachedAt: Date.now() };
  const newest = Object.entries(cache)
    .sort(([, a], [, b]) => b.cachedAt - a.cachedAt)
    .slice(0, 30);
  write(KEYS.productCache, Object.fromEntries(newest));
}
