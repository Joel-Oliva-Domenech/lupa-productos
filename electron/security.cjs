const path = require('node:path');

const APP_PROTOCOL = 'lupa:';
const APP_HOST = 'app';

const MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
});

function isTrustedAppUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === APP_PROTOCOL &&
      url.hostname === APP_HOST &&
      url.port === '' &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
}

function resolveAppAssetPath(distRoot, requestUrl) {
  if (!isTrustedAppUrl(requestUrl)) return null;

  let decodedRequest;
  let pathname;
  try {
    decodedRequest = decodeURIComponent(requestUrl);
    pathname = decodeURIComponent(new URL(requestUrl).pathname);
  } catch {
    return null;
  }

  if (
    decodedRequest.includes('\0') ||
    /(^|[\\/])\.\.([\\/]|$)/.test(decodedRequest)
  ) return null;

  const relativeAsset = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  if (!relativeAsset || relativeAsset.includes('\0')) return null;

  const root = path.resolve(distRoot);
  const candidate = path.resolve(root, relativeAsset);
  const relativeToRoot = path.relative(root, candidate);

  if (
    !relativeToRoot ||
    relativeToRoot.startsWith('..') ||
    path.isAbsolute(relativeToRoot)
  ) {
    return null;
  }

  return candidate;
}

function isVideoOnlyMediaRequest(details = {}) {
  return (
    Array.isArray(details.mediaTypes) &&
    details.mediaTypes.includes('video') &&
    !details.mediaTypes.includes('audio')
  );
}

function getContentType(assetPath) {
  return MIME_TYPES[path.extname(assetPath).toLowerCase()] || 'application/octet-stream';
}

module.exports = {
  getContentType,
  isTrustedAppUrl,
  isVideoOnlyMediaRequest,
  resolveAppAssetPath,
};
