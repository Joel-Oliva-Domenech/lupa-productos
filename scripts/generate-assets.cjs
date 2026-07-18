const sharp = require('sharp');

const iconSource = 'source-assets/lupa-icon-source.png';

async function generate() {
  await Promise.all([
    sharp(iconSource).resize(48, 48, { fit: 'cover' }).png().toFile('public/favicon-48x48.png'),
    sharp(iconSource)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile('public/apple-touch-icon-180x180.png'),
    sharp(iconSource)
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile('public/pwa-192x192.png'),
    sharp(iconSource)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile('public/pwa-512x512.png'),
    sharp(iconSource)
      .resize(512, 512, { fit: 'contain', background: '#f2ebdd' })
      .png()
      .toFile('public/maskable-icon-512x512.png'),
    sharp('source-assets/demo-oat-carton-transparent.png')
      .resize({ width: 720, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile('public/assets/demo-oat-carton.webp'),
    sharp('source-assets/paper-texture.png')
      .resize({ width: 860, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toFile('public/assets/paper-texture.webp'),
  ]);
  console.log('Iconos y recursos WebP generados.');
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
