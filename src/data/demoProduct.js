export const DEMO_BARCODE = '8412345678905';
const DEMO_IMAGE = import.meta.env.BASE_URL + 'assets/demo-oat-carton.webp';

export const DEMO_PRODUCT_RAW = {
  code: DEMO_BARCODE,
  product_name_es: 'Bebida de avena',
  product_name: 'Bebida de avena',
  brands: 'Producto de demostración',
  quantity: '1 L',
  image_front_url: DEMO_IMAGE,
  ingredients_text_es:
    'Agua, avena (11 %), aceite de girasol, sal y estabilizante: goma gellan.',
  ingredients_text:
    'Agua, avena (11 %), aceite de girasol, sal y estabilizante: goma gellan.',
  allergens_tags: ['en:gluten', 'en:oats'],
  additives_tags: ['en:e418'],
  nova_group: 4,
  nutriments: {
    'energy-kcal_100g': 46,
    sugars_100g: 4.2,
    fat_100g: 1.5,
    'saturated-fat_100g': 0.2,
    fiber_100g: 0.8,
    proteins_100g: 1.1,
    salt_100g: 0.09,
  },
  categories_tags: ['en:plant-based-beverages', 'en:oat-milks'],
  labels_tags: ['en:vegan'],
  data_quality_errors_tags: [],
  data_quality_warnings_tags: [],
  last_modified_t: Math.floor(Date.now() / 1000),
  _demo: true,
};
