import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';

interface QrScannerComponentProps {
  onScanSuccess: (decodedText: string) => void;
}

export const QrScannerComponent: React.FC<QrScannerComponentProps> = ({ onScanSuccess }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-container';

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScanSuccess(decodedText.trim());
          stopScanner();
        },
        (errorMessage) => {
          // ignore scan frame misses
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error or permission denied:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Puedes ingresar el código EQ-XX manualmente abajo o usar el selector rápido de equipos.'
      );
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.warn);
      }
    };
  }, []);

  return (
    <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-center">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-purple-400" />
          Escáner de Cámara WebRTC
        </span>

        {cameraActive ? (
          <button
            onClick={stopScanner}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            <CameraOff className="w-3.5 h-3.5" /> Detener Cámara
          </button>
        ) : (
          <button
            onClick={startScanner}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <Camera className="w-3.5 h-3.5" /> Activar Cámara
          </button>
        )}
      </div>

      {/* Camera Viewport */}
      <div className="relative min-h-[180px] bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-slate-800">
        <div id={containerId} className="w-full max-w-[320px] aspect-square mx-auto"></div>

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Camera className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 max-w-xs">
              Presiona "Activar Cámara" para escanear el código QR del equipo desde la pantalla de su celular.
            </p>
            <button
              onClick={startScanner}
              className="mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              Iniciar Escáner
            </button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs text-left flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}
    </div>
  );
};
