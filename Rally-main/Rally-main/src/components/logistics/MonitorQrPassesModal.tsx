import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRally } from '../../context/RallyContext';
import { EstacionId } from '../../types/rally';
import { ESTACIONES } from '../../data/mockData';
import { 
  QrCode, 
  RefreshCw, 
  Printer, 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Smartphone
} from 'lucide-react';

interface MonitorQrPassesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonitorQrPassesModal: React.FC<MonitorQrPassesModalProps> = ({ isOpen, onClose }) => {
  const { tokensMonitores, generarNuevoTokenMonitor } = useRally();

  const [selectedStation, setSelectedStation] = useState<EstacionId>('E1');
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Generate QR images for all stations
  useEffect(() => {
    if (isOpen) {
      tokensMonitores.forEach((item) => {
        // Payload formatted so monitor scanner immediately recognizes it
        const payload = JSON.stringify({
          type: 'AUTH_MONITOR_DEVICE',
          estacion_id: item.estacion_id,
          token: item.token
        });

        QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#030712',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        })
        .then((url) => {
          setQrImages((prev) => ({ ...prev, [item.estacion_id]: url }));
        })
        .catch(console.warn);
      });
    }
  }, [isOpen, tokensMonitores]);

  if (!isOpen) return null;

  const currentToken = tokensMonitores.find((t) => t.estacion_id === selectedStation);
  const currentEstConfig = ESTACIONES[selectedStation];

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRegenerate = (estId: EstacionId) => {
    if (window.confirm(`¿Regenerar el pase QR de la Estación ${estId}? Los dispositivos previamente conectados deberán volver a escanear.`)) {
      generarNuevoTokenMonitor(estId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white">
                Pases QR de Autorización para Monitores
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                Logística 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Muestra este código al monitor para que lo escanee desde su celular y habilite el panel de evaluación.
            </p>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
          {(['E1', 'E2', 'E3', 'E4', 'E5'] as EstacionId[]).map((eId) => {
            const isSel = selectedStation === eId;
            return (
              <button
                key={eId}
                onClick={() => setSelectedStation(eId)}
                className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                  isSel
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{eId}</span>
                <span className="text-[9px] font-normal opacity-80 hidden sm:inline">
                  {ESTACIONES[eId].nombre.slice(0, 10)}...
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Station Pass Card */}
        {currentToken && (
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-purple-500/30 flex flex-col sm:flex-row items-center gap-6">
            
            {/* The QR Image */}
            <div className="bg-white p-3.5 rounded-2xl shadow-inner shrink-0 border-2 border-purple-400/40 flex flex-col items-center">
              {qrImages[selectedStation] ? (
                <img
                  src={qrImages[selectedStation]}
                  alt={`QR Autorización ${selectedStation}`}
                  className="w-48 h-48 aspect-square object-contain select-none"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400 font-mono">
                  Generando QR...
                </div>
              )}
              <span className="text-[10px] font-mono font-bold text-slate-900 mt-1 uppercase">
                PASE OFICIAL {selectedStation}
              </span>
            </div>

            {/* Pass Metadata & Actions */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
                  Estación {currentEstConfig.numero} Oficial
                </span>
                <h4 className="text-lg font-black text-white">
                  {currentEstConfig.nombre}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentEstConfig.coordenadas.nombreLugar}
                </p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  Token Criptográfico de Dispositivo:
                </span>
                <div className="flex items-center justify-between font-mono font-bold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span>{currentToken.token}</span>
                  <button
                    onClick={() => handleCopy(currentToken.token)}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copiar token"
                  >
                    {copiedToken === currentToken.token ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Solo los teléfonos que lean este QR tendrán acceso a validar esta estación.</span>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => handleRegenerate(selectedStation)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  Regenerar Token QR
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Pase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
