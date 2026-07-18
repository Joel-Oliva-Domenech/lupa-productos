import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowsLeftRight,
  Barcode,
  Camera,
  CaretRight,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  DownloadSimple,
  Info,
  ListMagnifyingGlass,
  MagnifyingGlass,
  Plus,
  Scan,
  ShareNetwork,
  SlidersHorizontal,
  Sparkle,
  Trash,
  Warning,
  WifiSlash,
  X,
} from '@phosphor-icons/react';
import { Scanner } from './components/Scanner';
import { DEMO_BARCODE, DEMO_PRODUCT_RAW } from './data/demoProduct';
import { validateBarcode } from './lib/barcode';
import { fetchProduct, ProductNotFoundError } from './lib/openFoodFacts';
import {
  buildEvidence,
  formatDate,
  formatNumber,
  getKnownAndMissing,
  getPreferenceMatches,
  getSummary,
  normalizeProduct,
} from './lib/productAnalysis';
import {
  clearHistory,
  getHistory,
  getPreferences,
  rememberProduct,
  savePreferences,
} from './lib/storage';

const demoProduct = normalizeProduct(DEMO_PRODUCT_RAW, { source: 'demo' });

function AppHeader({ onHome, onHistory, onPreferences, minimal = false }) {
  return (
    <header className="app-header">
      <button className="wordmark" onClick={onHome} aria-label="Ir al inicio">
        Lupa
      </button>
      {minimal ? (
        <p className="tagline">Escanea. Entiende. Decide tú.</p>
      ) : (
        <div className="header-actions">
          <button className="icon-button" onClick={onHistory} aria-label="Ver historial">
            <ClockCounterClockwise aria-hidden="true" />
          </button>
          <button className="icon-button" onClick={onPreferences} aria-label="Abrir preferencias">
            <SlidersHorizontal aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}

function ManualSearch({ value, onChange, onSubmit, error, compact = false }) {
  return (
    <form className={'manual-search' + (compact ? ' manual-search--compact' : '')} onSubmit={onSubmit}>
      <label htmlFor="barcode-input">O escribe el número</label>
      <div className="input-row">
        <div className="text-input-wrap">
          <Barcode aria-hidden="true" />
          <input
            id="barcode-input"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ej. 8412345678905"
            aria-describedby={error ? 'barcode-error' : undefined}
            aria-invalid={Boolean(error)}
          />
        </div>
        <button className="icon-submit" type="submit" aria-label="Buscar producto">
          <MagnifyingGlass aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="form-error" id="barcode-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function HomeScreen({
  onScan,
  onDemo,
  onSearch,
  manualCode,
  setManualCode,
  manualError,
  onHistory,
  onPreferences,
  canInstall,
  onInstall,
}) {
  return (
    <main className="screen home-screen">
      <AppHeader
        onHome={() => undefined}
        onHistory={onHistory}
        onPreferences={onPreferences}
      />
      <section className="home-hero">
        <div className="home-copy">
          <p className="eyebrow">Información, no veredictos</p>
          <h1>Mira más allá de la etiqueta.</h1>
          <p className="lede">
            Escanea un producto para ver qué sabemos, qué falta y qué puede importarte a ti.
          </p>
        </div>
        <img
          className="home-product-image"
          src={demoProduct.imageUrl}
          alt="Envase ficticio de bebida de avena"
        />
      </section>

      <button className="button button--primary button--scan" onClick={onScan}>
        <Scan aria-hidden="true" />
        Escanear un producto
      </button>

      <ManualSearch
        value={manualCode}
        onChange={setManualCode}
        onSubmit={onSearch}
        error={manualError}
      />

      <div className="home-secondary-actions">
        <button className="text-button" onClick={onDemo}>
          <Sparkle aria-hidden="true" />
          Ver ejemplo interactivo
        </button>
        {canInstall && (
          <button className="text-button" onClick={onInstall}>
            <DownloadSimple aria-hidden="true" />
            Instalar Lupa
          </button>
        )}
      </div>

      <aside className="principle-card">
        <Info aria-hidden="true" />
        <div>
          <strong>Tu criterio va primero</strong>
          <p>
            No asignamos una nota universal. Mostramos evidencias, límites y la procedencia de
            cada dato.
          </p>
        </div>
      </aside>
    </main>
  );
}

function LoadingScreen({ onCancel }) {
  return (
    <main className="screen centered-screen" aria-live="polite">
      <div className="loading-mark">
        <MagnifyingGlass weight="thin" aria-hidden="true" />
      </div>
      <p className="eyebrow">Consultando la ficha</p>
      <h1>Buscando lo importante…</h1>
      <p>Contrastamos datos disponibles y señalamos también lo que falta.</p>
      <button className="text-button" onClick={onCancel}>
        Cancelar
      </button>
    </main>
  );
}

function ErrorScreen({ message, code, onRetry, onHome, onScan }) {
  return (
    <main className="screen">
      <div className="screen-topline">
        <button className="icon-button" onClick={onHome} aria-label="Volver al inicio">
          <ArrowLeft aria-hidden="true" />
        </button>
        <span className="eyebrow">No se pudo completar</span>
      </div>
      <section className="error-panel">
        <Warning weight="thin" aria-hidden="true" />
        <h1>No tenemos una respuesta fiable</h1>
        <p>{message}</p>
        {code && <code>{code}</code>}
      </section>
      <button className="button button--primary" onClick={onRetry}>
        Volver a intentar
      </button>
      <button className="button button--outline" onClick={onScan}>
        <Camera aria-hidden="true" />
        Escanear de nuevo
      </button>
      <p className="helper-copy">
        Si el producto no existe, puedes añadirlo desde Open Food Facts y ayudar a otras
        personas.
      </p>
    </main>
  );
}

function EvidenceRow({ item }) {
  const Icon = item.state === 'attention' ? Warning : item.state === 'known' ? CheckCircle : Info;
  return (
    <article className={'evidence-row evidence-row--' + item.state}>
      <div className="evidence-icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="evidence-copy">
        <span>{item.label}</span>
        <strong>{item.value}</strong>
        <p>{item.detail}</p>
      </div>
    </article>
  );
}

function ConfidenceBlock({ product }) {
  const { known, missing } = getKnownAndMissing(product);
  return (
    <section className="confidence-block" aria-labelledby="confidence-title">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Transparencia de datos</p>
          <h2 id="confidence-title">Confianza {product.confidence.label}</h2>
        </div>
        <strong className="confidence-number">{product.confidence.score}%</strong>
      </div>
      <div className="confidence-track" aria-hidden="true">
        <span style={{ width: product.confidence.score + '%' }} />
      </div>
      <p>{product.confidence.detail}</p>
      <details className="known-missing">
        <summary>
          Ver qué sabemos y qué falta
          <CaretRight aria-hidden="true" />
        </summary>
        <div className="known-missing-grid">
          <div>
            <strong>Sabemos</strong>
            <ul>
              {known.map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Falta</strong>
            <ul>
              {missing.length ? (
                missing.map((item) => (
                  <li key={item}>
                    <Plus aria-hidden="true" />
                    {item}
                  </li>
                ))
              ) : (
                <li>
                  <Check aria-hidden="true" />
                  Ningún dato esencial
                </li>
              )}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

function ResultScreen({
  product,
  preferences,
  onHome,
  onScan,
  onIngredients,
  onCompare,
  onShare,
  onHistory,
  onPreferences,
}) {
  const matches = getPreferenceMatches(product, preferences.avoidTerms);
  const evidence = buildEvidence(product);
  const sourceUrl =
    product.source === 'open-food-facts'
      ? 'https://world.openfoodfacts.org/product/' + product.code
      : null;

  return (
    <main className="screen result-screen">
      <AppHeader
        minimal
        onHome={onHome}
        onHistory={onHistory}
        onPreferences={onPreferences}
      />

      {product.offline && (
        <div className="status-strip">
          <WifiSlash aria-hidden="true" />
          Mostrando la última copia guardada
        </div>
      )}

      <section className="product-hero">
        <div className="product-title">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="product-meta">
            {[product.quantity, product.code].filter(Boolean).join(' · ')}
          </p>
        </div>
        <img src={product.imageUrl} alt={'Envase de ' + product.name} />
      </section>

      <section className="important-section">
        <p className="eyebrow">Lo importante</p>
        <p className="summary">{getSummary(product)}</p>
        <div className="evidence-list">
          {evidence.map((item) => (
            <EvidenceRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      {preferences.avoidTerms.length > 0 && (
        <aside className={'preference-alert' + (matches.length ? ' preference-alert--match' : '')}>
          {matches.length ? <Warning aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}
          <div>
            <strong>{matches.length ? 'Coincide con tus preferencias' : 'Sin coincidencias detectadas'}</strong>
            <p>
              {matches.length
                ? 'Aparece: ' + matches.join(', ') + '. Confírmalo siempre en el envase.'
                : 'No encontramos tus términos en los datos disponibles. La ficha puede estar incompleta.'}
            </p>
          </div>
        </aside>
      )}

      <ConfidenceBlock product={product} />

      <div className="result-actions">
        <button className="button button--primary" onClick={onIngredients}>
          <ListMagnifyingGlass aria-hidden="true" />
          Ver ingredientes
        </button>
        <button className="button button--outline" onClick={onCompare}>
          <ArrowsLeftRight aria-hidden="true" />
          Comparar con otro
        </button>
      </div>

      <div className="quiet-actions">
        <button className="text-button" onClick={onScan}>
          <Scan aria-hidden="true" />
          Escanear otro
        </button>
        <button className="text-button" onClick={onShare}>
          <ShareNetwork aria-hidden="true" />
          Compartir
        </button>
      </div>

      <footer className="source-note">
        <p>
          Lupa informa; no diagnostica ni sustituye el etiquetado. Las alertas alimentarias
          oficiales no se comprueban todavía en tiempo real.
        </p>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            Datos colaborativos de Open Food Facts · actualizados {formatDate(product.lastModified)}
          </a>
        ) : (
          <span>Ficha de demostración; no corresponde a un producto comercial.</span>
        )}
      </footer>
    </main>
  );
}

function IngredientsSheet({ product, onClose }) {
  const nutrients = [
    ['Energía', product.energyKcal !== null ? formatNumber(product.energyKcal) + ' kcal' : '—'],
    ['Grasas', product.fat !== null ? formatNumber(product.fat) + ' g' : '—'],
    [
      'Saturadas',
      product.saturatedFat !== null ? formatNumber(product.saturatedFat) + ' g' : '—',
    ],
    ['Azúcares', product.sugars !== null ? formatNumber(product.sugars) + ' g' : '—'],
    ['Fibra', product.fiber !== null ? formatNumber(product.fiber) + ' g' : '—'],
    ['Proteínas', product.proteins !== null ? formatNumber(product.proteins) + ' g' : '—'],
    ['Sal', product.salt !== null ? formatNumber(product.salt) + ' g' : '—'],
  ];
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredients-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Según la ficha</p>
            <h2 id="ingredients-title">Ingredientes</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="ingredients-text">
          {product.ingredients || 'La lista de ingredientes no está disponible.'}
        </p>
        <div className="nutrient-grid">
          {nutrients.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <p className="sheet-footnote">
          Valores por 100 g o 100 ml según la fuente. Comprueba el envase si tienes una alergia o
          una necesidad médica.
        </p>
      </section>
    </div>
  );
}

function HistoryScreen({ items, onBack, onSelect, onClear }) {
  return (
    <main className="screen">
      <div className="screen-topline">
        <button className="icon-button" onClick={onBack} aria-label="Volver">
          <ArrowLeft aria-hidden="true" />
        </button>
        <span className="eyebrow">Guardado en este dispositivo</span>
      </div>
      <header className="page-heading">
        <h1>Tu historial</h1>
        <p>Los últimos productos consultados, también disponibles sin conexión.</p>
      </header>
      {items.length ? (
        <>
          <div className="history-list">
            {items.map((item) => (
              <button key={item.code} className="history-item" onClick={() => onSelect(item)}>
                <img src={item.imageUrl} alt="" />
                <span>
                  <small>{item.brand}</small>
                  <strong>{item.name}</strong>
                  <em>{new Date(item.viewedAt).toLocaleDateString('es-ES')}</em>
                </span>
                <CaretRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <button className="text-button text-button--danger" onClick={onClear}>
            <Trash aria-hidden="true" />
            Borrar historial
          </button>
        </>
      ) : (
        <div className="empty-state">
          <ClockCounterClockwise weight="thin" aria-hidden="true" />
          <h2>Aún no hay productos</h2>
          <p>Cuando consultes uno, aparecerá aquí para volver a verlo fácilmente.</p>
        </div>
      )}
    </main>
  );
}

function PreferencesScreen({ preferences, onSave, onBack }) {
  const [draft, setDraft] = useState(preferences.avoidTerms.join(', '));

  function submit(event) {
    event.preventDefault();
    const avoidTerms = [...new Set(draft.split(',').map((term) => term.trim()).filter(Boolean))].slice(
      0,
      12,
    );
    onSave({ ...preferences, avoidTerms });
  }

  return (
    <main className="screen">
      <div className="screen-topline">
        <button className="icon-button" onClick={onBack} aria-label="Volver">
          <ArrowLeft aria-hidden="true" />
        </button>
        <span className="eyebrow">Solo en este dispositivo</span>
      </div>
      <header className="page-heading">
        <h1>Lo que te importa</h1>
        <p>
          Añade términos que prefieras evitar. Lupa buscará coincidencias literales sin decidir
          por ti.
        </p>
      </header>
      <form className="preferences-form" onSubmit={submit}>
        <label htmlFor="avoid-input">Ingredientes o alérgenos</label>
        <textarea
          id="avoid-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ej. leche, cacahuetes, aspartamo"
          rows="5"
        />
        <p>Sepáralos con comas. No enviamos esta información a ningún servidor.</p>
        <button className="button button--primary" type="submit">
          <Check aria-hidden="true" />
          Guardar preferencias
        </button>
      </form>
      <aside className="principle-card">
        <Info aria-hidden="true" />
        <p>
          Una coincidencia no confirma riesgo ni cantidad. Para alergias, verifica siempre el
          envase y sigue consejo profesional.
        </p>
      </aside>
    </main>
  );
}

function ComparisonScreen({ base, target, onBack, onScan, manualProps }) {
  const metrics = [
    ['Azúcares', base.sugars, target?.sugars, ' g'],
    ['Sal', base.salt, target?.salt, ' g'],
    ['Aditivos', base.additivesCount, target?.additivesCount, ''],
    ['NOVA', base.nova, target?.nova, ''],
  ];
  return (
    <main className="screen comparison-screen">
      <div className="screen-topline">
        <button className="icon-button" onClick={onBack} aria-label="Volver al producto">
          <ArrowLeft aria-hidden="true" />
        </button>
        <span className="eyebrow">Comparación descriptiva</span>
      </div>
      <header className="page-heading">
        <h1>Compara dato a dato</h1>
        <p>Sin ganador automático: elige según tus prioridades.</p>
      </header>
      <div className="comparison-products">
        <article>
          <img src={base.imageUrl} alt="" />
          <strong>{base.name}</strong>
        </article>
        <ArrowsLeftRight aria-hidden="true" />
        {target ? (
          <article>
            <img src={target.imageUrl} alt="" />
            <strong>{target.name}</strong>
          </article>
        ) : (
          <button className="comparison-empty" onClick={onScan}>
            <Plus aria-hidden="true" />
            Añadir producto
          </button>
        )}
      </div>
      {target ? (
        <div className="comparison-table">
          {metrics.map(([label, left, right, suffix]) => (
            <div className="comparison-row" key={label}>
              <span>{left === null ? '—' : formatNumber(left) + suffix}</span>
              <strong>{label}</strong>
              <span>{right === null ? '—' : formatNumber(right) + suffix}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <button className="button button--primary" onClick={onScan}>
            <Scan aria-hidden="true" />
            Escanear el segundo
          </button>
          <ManualSearch compact {...manualProps} />
        </>
      )}
      <p className="helper-copy">
        Las cifras se muestran por 100 g o ml tal como aparecen en cada ficha. Comprueba que los
        formatos sean comparables.
      </p>
    </main>
  );
}

function Toast({ children }) {
  return (
    <div className="toast" role="status">
      <CheckCircle aria-hidden="true" />
      {children}
    </div>
  );
}

export function App() {
  const startsInDemo = new URLSearchParams(window.location.search).get('demo') === '1';
  const [screen, setScreen] = useState(startsInDemo ? 'result' : 'home');
  const [product, setProduct] = useState(startsInDemo ? demoProduct : null);
  const [comparisonTarget, setComparisonTarget] = useState(null);
  const [scannerPurpose, setScannerPurpose] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [lastCode, setLastCode] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState(getHistory);
  const [preferences, setPreferences] = useState(getPreferences);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    function captureInstall(event) {
      event.preventDefault();
      setInstallEvent(event);
    }
    window.addEventListener('beforeinstallprompt', captureInstall);
    return () => window.removeEventListener('beforeinstallprompt', captureInstall);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openScanner = useCallback((purpose = 'primary') => {
    setScannerPurpose(purpose);
  }, []);

  const showProduct = useCallback((nextProduct) => {
    setProduct(nextProduct);
    setHistory(rememberProduct(nextProduct));
    setScreen('result');
  }, []);

  const search = useCallback(
    async (code, purpose = 'primary') => {
      setLastCode(code);
      setManualError('');
      setScannerPurpose(null);
      setScreen('loading');
      try {
        const { raw, offline } = await fetchProduct(code);
        const nextProduct = normalizeProduct(raw, {
          code,
          source: 'open-food-facts',
          offline,
        });
        if (purpose === 'compare') {
          setComparisonTarget(nextProduct);
          setHistory(rememberProduct(nextProduct));
          setScreen('compare');
        } else {
          showProduct(nextProduct);
        }
        setManualCode('');
      } catch (searchError) {
        setError(
          searchError instanceof ProductNotFoundError
            ? searchError.message
            : searchError.message || 'Ha ocurrido un error inesperado.',
        );
        setScreen('error');
      }
    },
    [showProduct],
  );

  const handleDetected = useCallback(
    (code) => {
      const purpose = scannerPurpose ?? 'primary';
      search(code, purpose);
    },
    [scannerPurpose, search],
  );

  function submitManual(event, purpose = screen === 'compare' ? 'compare' : 'primary') {
    event.preventDefault();
    const validation = validateBarcode(manualCode);
    if (!validation.valid) {
      setManualError(validation.message);
      return;
    }
    search(validation.code, purpose);
  }

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  async function shareProduct() {
    if (!product) return;
    const shareData = {
      title: product.name + ' — Lupa',
      text: getSummary(product),
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
        setToast('Resumen copiado');
      }
    } catch {
      // Closing the native share sheet is not an error for the user.
    }
  }

  const previousScreen = useMemo(
    () => (product ? 'result' : 'home'),
    [product],
  );

  let content;
  if (screen === 'home') {
    content = (
      <HomeScreen
        onScan={() => openScanner('primary')}
        onDemo={() => showProduct(demoProduct)}
        onSearch={submitManual}
        manualCode={manualCode}
        setManualCode={setManualCode}
        manualError={manualError}
        onHistory={() => setScreen('history')}
        onPreferences={() => setScreen('preferences')}
        canInstall={Boolean(installEvent)}
        onInstall={installApp}
      />
    );
  } else if (screen === 'loading') {
    content = <LoadingScreen onCancel={() => setScreen(previousScreen)} />;
  } else if (screen === 'error') {
    content = (
      <ErrorScreen
        message={error}
        code={lastCode}
        onRetry={() => search(lastCode)}
        onHome={() => {
          setManualCode('');
          setManualError('');
          setScreen('home');
        }}
        onScan={() => openScanner('primary')}
      />
    );
  } else if (screen === 'result' && product) {
    content = (
      <ResultScreen
        product={product}
        preferences={preferences}
        onHome={() => {
          setManualCode('');
          setManualError('');
          setScreen('home');
        }}
        onScan={() => openScanner('primary')}
        onIngredients={() => setIngredientsOpen(true)}
        onCompare={() => {
          setComparisonTarget(null);
          setScreen('compare');
        }}
        onShare={shareProduct}
        onHistory={() => setScreen('history')}
        onPreferences={() => setScreen('preferences')}
      />
    );
  } else if (screen === 'history') {
    content = (
      <HistoryScreen
        items={history}
        onBack={() => setScreen(previousScreen)}
        onSelect={(item) => {
          setProduct(item);
          setScreen('result');
        }}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
      />
    );
  } else if (screen === 'preferences') {
    content = (
      <PreferencesScreen
        preferences={preferences}
        onBack={() => setScreen(previousScreen)}
        onSave={(next) => {
          savePreferences(next);
          setPreferences(next);
          setToast('Preferencias guardadas');
          setScreen(previousScreen);
        }}
      />
    );
  } else if (screen === 'compare' && product) {
    content = (
      <ComparisonScreen
        base={product}
        target={comparisonTarget}
        onBack={() => {
          setManualCode('');
          setManualError('');
          setScreen('result');
        }}
        onScan={() => openScanner('compare')}
        manualProps={{
          value: manualCode,
          onChange: setManualCode,
          onSubmit: (event) => submitManual(event, 'compare'),
          error: manualError,
        }}
      />
    );
  } else {
    content = null;
  }

  return (
    <div className="app-shell">
      {content}
      {scannerPurpose && (
        <Scanner
          onClose={() => setScannerPurpose(null)}
          onDetected={handleDetected}
        />
      )}
      {ingredientsOpen && product && (
        <IngredientsSheet product={product} onClose={() => setIngredientsOpen(false)} />
      )}
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}
