import path from 'node:path';
import { describe, expect, it } from 'vitest';
import security from './security.cjs';

const {
  getContentType,
  isTrustedAppUrl,
  isVideoOnlyMediaRequest,
  resolveAppAssetPath,
} = security;

describe('seguridad de escritorio', () => {
  const root = path.resolve('dist');

  it('acepta solo el origen interno exacto de Lupa', () => {
    expect(isTrustedAppUrl('lupa://app/')).toBe(true);
    expect(isTrustedAppUrl('https://app/')).toBe(false);
    expect(isTrustedAppUrl('lupa://evil/')).toBe(false);
    expect(isTrustedAppUrl('lupa://user@app/')).toBe(false);
  });

  it('mantiene todos los recursos dentro de dist', () => {
    expect(resolveAppAssetPath(root, 'lupa://app/')).toBe(path.join(root, 'index.html'));
    expect(resolveAppAssetPath(root, 'lupa://app/assets/app.js')).toBe(
      path.join(root, 'assets', 'app.js'),
    );
    expect(resolveAppAssetPath(root, 'lupa://app/%2e%2e/secret.txt')).toBeNull();
    expect(resolveAppAssetPath(root, 'lupa://app/%5c..%5csecret.txt')).toBeNull();
  });

  it('autoriza vídeo sin conceder acceso al micrófono', () => {
    expect(isVideoOnlyMediaRequest({ mediaTypes: ['video'] })).toBe(true);
    expect(isVideoOnlyMediaRequest({ mediaTypes: ['audio', 'video'] })).toBe(false);
    expect(isVideoOnlyMediaRequest({ mediaTypes: ['audio'] })).toBe(false);
  });

  it('sirve el manifiesto y los scripts con tipos seguros', () => {
    expect(getContentType('manifest.webmanifest')).toContain('manifest+json');
    expect(getContentType('app.js')).toContain('javascript');
    expect(getContentType('unknown.bin')).toBe('application/octet-stream');
  });
});
