import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  FrameCorners,
  ImageSquare,
  WarningCircle,
} from '@phosphor-icons/react';
import { cleanBarcode, validateBarcode } from '../lib/barcode';

export function Scanner({ onClose, onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState('starting');
  const [message, setMessage] = useState('Preparando la cámara…');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setMessage('Este navegador no permite acceder a la cámara. Puedes subir una foto.');
        return;
      }

      try {
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
        if (cancelled) return;
        const reader = new BrowserMultiFormatOneDReader(undefined, {
          delayBetweenScanAttempts: 180,
          delayBetweenScanSuccess: 800,
        });
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (!result || handledRef.current) return;
            const code = cleanBarcode(result.getText());
            if (!validateBarcode(code).valid) return;
            handledRef.current = true;
            controlsRef.current?.stop();
            onDetected(code);
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus('ready');
        setMessage('Centra el código de barras dentro del marco.');
      } catch (error) {
        if (cancelled) return;
        const denied =
          error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
        setStatus('error');
        setMessage(
          denied
            ? 'No tenemos permiso para usar la cámara. Actívalo o sube una foto.'
            : 'No pudimos iniciar la cámara. Puedes probar con una foto del código.',
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDetected]);

  async function scanImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus('starting');
    setMessage('Buscando un código en la imagen…');
    const objectUrl = URL.createObjectURL(file);
    try {
      const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatOneDReader();
      const result = await reader.decodeFromImageUrl(objectUrl);
      const code = cleanBarcode(result.getText());
      const validation = validateBarcode(code);
      if (!validation.valid) throw new Error(validation.message);
      onDetected(code);
    } catch {
      setStatus('error');
      setMessage('No se distingue un código válido. Prueba con más luz y sin reflejos.');
    } finally {
      URL.revokeObjectURL(objectUrl);
      event.target.value = '';
    }
  }

  return (
    <section className="scanner-screen" aria-labelledby="scanner-title">
      <header className="screen-header scanner-header">
        <button className="icon-button icon-button--light" onClick={onClose} aria-label="Volver">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow eyebrow--light">Escáner</p>
          <h1 id="scanner-title">Encuentra el código</h1>
        </div>
      </header>

      <div className="camera-stage">
        <video ref={videoRef} className="camera-preview" muted playsInline aria-label="Vista de la cámara" />
        <div className="camera-frame" aria-hidden="true">
          <FrameCorners weight="thin" />
        </div>
        {status === 'starting' && (
          <div className="camera-status">
            <Camera weight="thin" aria-hidden="true" />
            <span>Abriendo cámara</span>
          </div>
        )}
      </div>

      <div className="scanner-copy" role={status === 'error' ? 'alert' : 'status'}>
        {status === 'error' ? (
          <WarningCircle aria-hidden="true" />
        ) : (
          <FrameCorners aria-hidden="true" />
        )}
        <p>{message}</p>
      </div>

      <label className="button button--paper file-button">
        <ImageSquare aria-hidden="true" />
        Leer desde una foto
        <input type="file" accept="image/*" onChange={scanImage} />
      </label>
      <p className="privacy-note">
        La imagen se procesa en tu dispositivo. No guardamos la cámara ni la foto.
      </p>
    </section>
  );
}
