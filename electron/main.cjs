const fs = require('node:fs/promises');
const path = require('node:path');
const { app, BrowserWindow, protocol, session } = require('electron');
const {
  getContentType,
  isTrustedAppUrl,
  isVideoOnlyMediaRequest,
  resolveAppAssetPath,
} = require('./security.cjs');

const APP_SCHEME = 'lupa';
const APP_URL = 'lupa://app/';
const APP_ID = 'io.github.joelolivadomenech.lupa';
const IS_SMOKE_TEST = process.argv.includes('--smoke-test');

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://images.openfoodfacts.org",
  "connect-src 'self' https://world.openfoodfacts.org",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "form-action 'none'",
].join('; ');

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      codeCache: true,
    },
  },
]);

app.enableSandbox();

function responseHeaders(assetPath) {
  return {
    'Cache-Control': assetPath.endsWith('index.html') || assetPath.endsWith('sw.js')
      ? 'no-cache'
      : 'public, max-age=31536000, immutable',
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
    'Content-Type': getContentType(assetPath),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
  };
}

function registerAppProtocol() {
  const distRoot = path.join(app.getAppPath(), 'dist');

  protocol.handle(APP_SCHEME, async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Método no permitido.', { status: 405 });
    }

    const assetPath = resolveAppAssetPath(distRoot, request.url);
    if (!assetPath) return new Response('Recurso no encontrado.', { status: 404 });

    try {
      const body = request.method === 'HEAD' ? null : await fs.readFile(assetPath);
      return new Response(body, {
        status: 200,
        headers: responseHeaders(assetPath),
      });
    } catch (error) {
      if (error && error.code !== 'ENOENT') console.error('No se pudo servir el recurso:', error);
      return new Response('Recurso no encontrado.', { status: 404 });
    }
  });
}

function configurePermissions() {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details = {}) => {
      const requestingUrl = details.requestingUrl || webContents.getURL();
      const allowCamera =
        permission === 'media' &&
        details.isMainFrame !== false &&
        isTrustedAppUrl(requestingUrl) &&
        isVideoOnlyMediaRequest(details);

      callback(allowCamera);
    },
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details = {}) =>
      permission === 'media' &&
      details.mediaType === 'video' &&
      details.isMainFrame !== false &&
      isTrustedAppUrl(details.requestingUrl || requestingOrigin || webContents?.getURL()),
  );
}

function attachNavigationGuards(mainWindow) {
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('will-navigate', (event, destination) => {
    if (!isTrustedAppUrl(destination)) event.preventDefault();
  });

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
}

function runSmokeCheck(mainWindow) {
  const timeout = setTimeout(() => {
    console.error('LUPA_DESKTOP_SMOKE_TIMEOUT');
    app.exit(1);
  }, 20000);

  mainWindow.webContents.once('did-fail-load', (_event, code, description) => {
    clearTimeout(timeout);
    console.error('LUPA_DESKTOP_SMOKE_FAILED', code, description);
    app.exit(1);
  });

  mainWindow.webContents.once('did-finish-load', async () => {
    try {
      const result = await mainWindow.webContents.executeJavaScript(
        `new Promise((resolve) => {
          setTimeout(() => resolve({
            title: document.title,
            hasContent: Boolean(document.querySelector('#root')?.textContent?.trim()),
            protocol: location.protocol,
          }), 500);
        })`,
        true,
      );

      clearTimeout(timeout);
      if (
        result.title.includes('Lupa') &&
        result.hasContent &&
        result.protocol === 'lupa:'
      ) {
        console.log('LUPA_DESKTOP_SMOKE_OK');
        setTimeout(() => app.exit(0), 100);
        return;
      }

      console.error('LUPA_DESKTOP_SMOKE_INVALID', JSON.stringify(result));
      app.exit(1);
    } catch (error) {
      clearTimeout(timeout);
      console.error('LUPA_DESKTOP_SMOKE_FAILED', error);
      app.exit(1);
    }
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 390,
    minHeight: 640,
    show: false,
    title: 'Lupa',
    backgroundColor: '#f2ebdd',
    autoHideMenuBar: true,
    icon: path.join(app.getAppPath(), 'dist', 'pwa-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged,
    },
  });

  attachNavigationGuards(mainWindow);

  if (IS_SMOKE_TEST) {
    runSmokeCheck(mainWindow);
  } else {
    mainWindow.once('ready-to-show', () => mainWindow.show());
  }

  mainWindow.loadURL(APP_URL).catch((error) => {
    console.error('No se pudo iniciar Lupa:', error);
    if (IS_SMOKE_TEST) app.exit(1);
  });

  return mainWindow;
}

app.whenReady()
  .then(() => {
    app.setAppUserModelId(APP_ID);
    registerAppProtocol();
    configurePermissions();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((error) => {
    console.error('Lupa no pudo iniciarse:', error);
    app.exit(1);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
