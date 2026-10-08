import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRally } from '../../context/RallyContext';
import { ESTACIONES } from '../../data/mockData';
import { 
  X, 
  Share2, 
  QrCode, 
  Copy, 
  Check, 
  Smartphone, 
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  ExternalLink,
  Download,
  Maximize2
} from 'lucide-react';

interface ShareDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareDevicesModal: React.FC<ShareDevicesModalProps> = ({ isOpen, onClose }) => {
  const { equipos } = useRally();
  const [activeTab, setActiveTab] = useState<'general' | 'equipos' | 'monitores'>('general');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrModalFullscreen, setQrModalFullscreen] = useState(false);

  // Compute base URL
  const baseUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'https://ais-pre-scjearfb7h3hyjeg7532nb-731370136059.us-east1.run.app'
        : window.location.origin)
    : 'https://ais-pre-scjearfb7h3hyjeg7532nb-731370136059.us-east1.run.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(baseUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#030712',
          light: '#ffffff'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(console.warn);
    }
  }, [isOpen, baseUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Compartir con Otros Dispositivos
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Multi-Dispositivo
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acceso oficial para teléfonos celulares, tablets y computadoras de participantes y monitores.
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Código QR & Enlace General</span>
          </button>

          <button
            onClick={() => setActiveTab('equipos')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'equipos'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enlaces Directos por Equipo ({equipos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monitores')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'monitores'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enlaces para Monitores (5 Estaciones)</span>
          </button>
        </div>

        {/* Tab 1: General QR & URL */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              
              {/* QR Preview */}
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 mb-3 relative group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="QR Rally de Datos 2026" 
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-lg" />
                  )}
                  <button
                    onClick={() => setQrModalFullscreen(true)}
                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center text-white gap-1.5 text-xs font-bold"
                  >
                    <Maximize2 className="w-5 h-5" /> Ampliar
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Escanea con la cámara de cualquier celular
                </span>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download="QR_Rally_Datos_2026.png"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <Download className="w-3 h-3" /> Descargar imagen QR
                  </a>
                )}
              </div>

              {/* Instructions and Copy link */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">
                    ¿Cómo funciona en otros dispositivos?
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Cualquier persona puede abrir este enlace desde su celular, tablet o laptop. Desde allí pueden:
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                    <li><strong className="text-white">Crear su propio equipo</strong> sin depender de esta máquina.</li>
                    <li><strong className="text-white">Unirse a su equipo</strong> para sincronizar notas y pasaportes.</li>
                    <li><strong className="text-white">Validar estaciones</strong> como monitor oficial.</li>
                  </ul>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase font-bold">
                    Enlace de Acceso Compartible:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={baseUrl}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(baseUrl, 'general')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                        copiedKey === 'general'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      }`}
                    >
                      {copiedKey === 'general' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'general' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct links per team */}
        {activeTab === 'equipos' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Comparte estos enlaces específicos con los integrantes de cada equipo. Al abrir el enlace en su celular, entrarán directamente a su pasaporte sin tener que escanear nada:
            </p>

            {equipos.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400">
                Aún no hay equipos creados. Puedes crear equipos desde la vista de Participante o desde Logística.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {equipos.map((eq) => {
                  const teamUrl = `${baseUrl}?team=${eq.equipo_id}`;
                  return (
                    <div 
                      key={eq.equipo_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{eq.avatar}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{eq.nombre}</div>
                          <div className="text-[10px] font-mono text-cyan-400">
                            {eq.equipo_id} • Ruta {eq.ruta_id} • {eq.integrantes.join(', ') || 'Sin integrantes'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyToClipboard(teamUrl, `eq-${eq.equipo_id}`)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                            copiedKey === `eq-${eq.equipo_id}`
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {copiedKey === `eq-${eq.equipo_id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === `eq-${eq.equipo_id}` ? 'Copiado' : 'Copiar Link'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Direct links for Station Monitors */}
        {activeTab === 'monitores' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Envía estos enlaces a los monitores o docentes de cada estación física. Al hacer clic desde su teléfono, su dispositivo se configurará automáticamente para validar esa estación:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(['E1', 'E2', 'E3', 'E4', 'E5'] as const).map((estId) => {
                const est = ESTACIONES[estId];
                const monitorUrl = `${baseUrl}?rol=monitor&estacion=${estId}`;
                return (
                  <div 
                    key={estId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-purple-300 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-200 font-mono text-[10px]">
                          {estId}
                        </span>
                        <span>{est.nombre}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {est.subtitulo}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(monitorUrl, `mon-${estId}`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          copiedKey === `mon-${estId}`
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-purple-900/80 hover:bg-purple-800 text-purple-200'
                        }`}
                      >
                        {copiedKey === `mon-${estId}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === `mon-${estId}` ? 'Copiado' : 'Copiar Link'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Totalmente compatible con iOS Safari, Android Chrome y computadoras de escritorio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Fullscreen QR Projector Modal */}
      {qrModalFullscreen && (
        <div className="fixed inset-0 z-60 bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <button
            onClick={() => setQrModalFullscreen(false)}
            className="absolute top-6 right-6 p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-2xl mb-6">
            <img 
              src={qrDataUrl} 
              alt="QR Grande Rally 2026" 
              className="w-full aspect-square object-contain"
            />
          </div>

          <h2 className="text-3xl font-black text-white mb-2">
            Rally de Datos 2026
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mb-4">
            Escanea este código con la cámara de tu teléfono móvil para acceder al sistema y registrar tu equipo.
          </p>
          <div className="text-cyan-400 font-mono text-sm bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            {baseUrl}
          </div>
        </div>
      )}
    </div>
  );
};
