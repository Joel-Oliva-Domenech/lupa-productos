const NOVA_LABELS = {
  1: 'Sin procesar o mínimamente procesado',
  2: 'Ingrediente culinario procesado',
  3: 'Alimento procesado',
  4: 'Ultraprocesado según NOVA',
};

const FALLBACK_IMAGE = import.meta.env.BASE_URL + 'assets/demo-oat-carton.webp';

const ALLERGEN_NAMES = {
  'en:gluten': 'gluten',
  'en:oats': 'avena',
  'en:milk': 'leche',
  'en:eggs': 'huevo',
  'en:soybeans': 'soja',
  'en:peanuts': 'cacahuetes',
  'en:nuts': 'frutos de cáscara',
  'en:sesame-seeds': 'sésamo',
  'en:fish': 'pescado',
  'en:crustaceans': 'crustáceos',
  'en:celery': 'apio',
  'en:mustard': 'mostaza',
  'en:sulphur-dioxide-and-sulphites': 'sulfitos',
};

const compact = (values) => values.filter(Boolean);
const stringValue = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
const numberValue = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

function translateAllergen(tag) {
  return ALLERGEN_NAMES[tag] ?? tag.replace(/^[a-z]{2}:/, '').replaceAll('-', ' ');
}

function getAgeInDays(timestamp) {
  if (!timestamp) return null;
  return Math.max(0, Math.round((Date.now() - Number(timestamp) * 1000) / 86_400_000));
}

function buildConfidence(product) {
  const checks = [
    Boolean(product.name),
    Boolean(product.imageUrl),
    Boolean(product.ingredients),
    product.sugars !== null || product.salt !== null || product.fat !== null,
    Array.isArray(product.allergens),
    product.nova !== null || product.additivesCount !== null,
    Boolean(product.lastModified),
  ];
  const completeness = checks.filter(Boolean).length / checks.length;
  const ageDays = getAgeInDays(product.lastModified);
  const freshness = ageDays === null ? 0.55 : ageDays < 365 ? 1 : ageDays < 1095 ? 0.8 : 0.55;
  const qualityPenalty = Math.min(
    0.25,
    product.qualityWarnings.length * 0.05 + product.qualityErrors.length * 0.12,
  );
  const score = Math.max(
    0,
    Math.round((completeness * 0.8 + freshness * 0.2 - qualityPenalty) * 100),
  );
  const label = score >= 80 ? 'alta' : score >= 55 ? 'media' : 'baja';
  return {
    score,
    label,
    detail:
      label === 'alta'
        ? 'La ficha tiene la mayoría de datos clave y parece reciente.'
        : label === 'media'
          ? 'Hay información útil, pero faltan algunos datos o conviene verificarlos.'
          : 'La ficha es incompleta. Comprueba el envase antes de decidir.',
  };
}

export function normalizeProduct(raw = {}, meta = {}) {
  const nutriments = raw.nutriments ?? {};
  const product = {
    code: String(raw.code ?? meta.code ?? ''),
    name:
      stringValue(
        raw.product_name_es,
        raw.product_name,
        raw.generic_name_es,
        raw.generic_name,
      ) || 'Producto sin nombre',
    brand: stringValue(raw.brands) || 'Marca no indicada',
    quantity: stringValue(raw.quantity),
    imageUrl: stringValue(raw.image_front_url, raw.image_url) || FALLBACK_IMAGE,
    ingredients: stringValue(raw.ingredients_text_es, raw.ingredients_text),
    allergens: Array.isArray(raw.allergens_tags)
      ? raw.allergens_tags.map(translateAllergen)
      : [],
    additives: Array.isArray(raw.additives_tags) ? raw.additives_tags : [],
    additivesCount: Array.isArray(raw.additives_tags)
      ? raw.additives_tags.length
      : numberValue(raw.additives_n),
    nova: numberValue(raw.nova_group),
    sugars: numberValue(nutriments.sugars_100g),
    salt: numberValue(nutriments.salt_100g),
    fat: numberValue(nutriments.fat_100g),
    saturatedFat: numberValue(nutriments['saturated-fat_100g']),
    fiber: numberValue(nutriments.fiber_100g),
    proteins: numberValue(nutriments.proteins_100g),
    energyKcal: numberValue(nutriments['energy-kcal_100g']),
    qualityWarnings: raw.data_quality_warnings_tags ?? [],
    qualityErrors: raw.data_quality_errors_tags ?? [],
    lastModified: numberValue(raw.last_modified_t),
    source: meta.source ?? (raw._demo ? 'demo' : 'open-food-facts'),
    offline: Boolean(meta.offline),
    demo: Boolean(raw._demo),
  };

  return { ...product, confidence: buildConfidence(product) };
}

export function getSummary(product) {
  const known = compact([
    product.sugars !== null
      ? formatNumber(product.sugars) + ' g de azúcares por 100 g o ml'
      : '',
    product.nova ? 'clasificación NOVA ' + product.nova : '',
    product.additivesCount !== null
      ? product.additivesCount +
        ' ' +
        (product.additivesCount === 1 ? 'aditivo identificado' : 'aditivos identificados')
      : '',
  ]);

  if (!known.length) {
    return 'La ficha no contiene datos suficientes para resumir el producto. Revisa el envase y, si puedes, completa la información en la fuente.';
  }

  return 'Datos disponibles: ' + known.join(' · ') + '.';
}

export function buildEvidence(product) {
  return [
    {
      id: 'sugar',
      label: 'Azúcares',
      value:
        product.sugars !== null
          ? formatNumber(product.sugars) + ' g / 100 g o ml'
          : 'Sin dato',
      detail:
        product.sugars !== null
          ? 'Cantidad declarada en la tabla nutricional.'
          : 'No consta en la ficha.',
      state: product.sugars !== null ? 'known' : 'missing',
    },
    {
      id: 'processing',
      label: 'Procesamiento',
      value: product.nova ? 'NOVA ' + product.nova : 'Sin clasificar',
      detail: product.nova
        ? NOVA_LABELS[product.nova] ?? 'Clasificación NOVA declarada.'
        : 'No hay grupo NOVA disponible.',
      state: product.nova ? 'known' : 'missing',
    },
    {
      id: 'composition',
      label: 'Composición',
      value:
        (product.additivesCount !== null
          ? product.additivesCount +
            ' ' +
            (product.additivesCount === 1 ? 'aditivo' : 'aditivos')
          : 'Aditivos sin dato') +
        (product.allergens.length ? ' · ' + product.allergens.join(', ') : ''),
      detail: product.allergens.length
        ? 'Alérgenos indicados y aditivos identificados en la ficha.'
        : 'La ausencia de alérgenos en la ficha no garantiza su ausencia.',
      state:
        product.allergens.length || product.additivesCount !== null ? 'attention' : 'missing',
    },
  ];
}

export function getPreferenceMatches(product, avoidTerms = []) {
  const haystack = (product.ingredients + ' ' + product.allergens.join(' ')).toLocaleLowerCase(
    'es',
  );
  return avoidTerms.filter((term) => haystack.includes(term.toLocaleLowerCase('es')));
}

export function getKnownAndMissing(product) {
  const known = compact([
    product.ingredients && 'Lista de ingredientes',
    product.sugars !== null && 'Azúcares',
    product.nova && 'Clasificación NOVA',
    product.additivesCount !== null && 'Aditivos',
    product.allergens.length && 'Alérgenos',
  ]);
  const missing = compact([
    !product.ingredients && 'Ingredientes',
    product.sugars === null && 'Azúcares',
    !product.nova && 'Clasificación NOVA',
    product.additivesCount === null && 'Aditivos',
    !product.allergens.length && 'Alérgenos verificados',
  ]);
  return { known, missing };
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(timestamp) {
  if (!timestamp) return 'Fecha desconocida';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(
    new Date(timestamp * 1000),
  );
}
