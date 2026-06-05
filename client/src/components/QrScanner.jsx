import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID = 'qr-scanner-region';

function QrScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().then(() => {
            onScan(decodedText.trim());
          });
        },
        () => {} // ignore per-frame errors
      )
      .then(() => setStarted(true))
      .catch((err) => setError('Camera access denied. Please allow camera permission and try again.'));

    return () => {
      if (scannerRef.current) {
        scannerRef.current.isScanning && scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-card shadow-card w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-primary">Scan Patient QR Code</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-red-500 text-sm text-center py-6">{error}</div>
          ) : (
            <>
              <p className="text-sm text-muted text-center mb-3">
                Point the camera at the patient's QR code
              </p>
              <div
                id={SCANNER_ID}
                className="w-full rounded-lg overflow-hidden"
                style={{ minHeight: 300 }}
              />
              {!started && (
                <p className="text-xs text-muted text-center mt-2">Starting camera…</p>
              )}
            </>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 border border-border rounded-btn text-muted hover:bg-faint transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default QrScanner;
