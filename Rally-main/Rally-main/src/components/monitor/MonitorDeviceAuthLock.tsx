import React, { useState } from 'react';
import { useRally } from '../../context/RallyContext';
import { QrScannerComponent } from './QrScannerComponent';
import { ESTACIONES } from '../../data/mockData';
import { EstacionId } from '../../types/rally';
import { 
  ShieldAlert, 
  QrCode, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface MonitorDeviceAuthLockProps {
  onSuccessAuth: () => void;
}

export const MonitorDeviceAuthLock: React.FC<MonitorDeviceAuthLockProps> = ({ onSuccessAuth }) => {
  const { 
    autorizarDispositivoMonitor, 
    autorizarEstacionDirecta,
    tokensMonitores, 
    setActiveRole 
  } = useRally();

  const [inputToken, setInputToken] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'qr'>('quick');

  const handleVerify = (tokenStr: string) => {
    setAuthError(null);
    setAuthSuccess(null);

    const result = autorizarDispositivoMonitor(tokenStr);
    if (result.ok) {
      setAuthSuccess(result.mensaje);
      setTimeout(() => {
        onSuccessAuth();
      }, 1000);
    } else {
      setAuthError(result.mensaje);
    }
  };

  const handleSelectStationDirect = (estId: EstacionId) => {
    autorizarEstacionDirecta(estId);
    setAuthSuccess(`¡Dispositivo configurado como Monitor de ${ESTACIONES[estId].nombre} (${estId})!`);
    setTimeout(() => {
      onSuccessAuth();
    }, 600);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

        {/* Lock Screen Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 shadow-xl shadow-purple-950">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold uppercase mb-2">
            Dispositivo de Monitor
          </div>

          <h2 className="text-2xl font-black text-white">
            Vincular Dispositivo a una Estación
          </h2>
          <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
            Selecciona la estación física en la que te encuentras operando para comenzar a recibir y evaluar equipos.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-2 px-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Selección Rápida de Estación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Escanear Pase QR</span>
          </button>
        </div>

        {/* Success Alert */}
        {authSuccess && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <span className="font-semibold">{authSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Mode 1: Quick Station Selector (1-click binding for physical tables) */}
        {activeTab === 'quick' && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-400">
              Presiona sobre la estación que te corresponde evaluar para activar los controles en este dispositivo:
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(['E1', 'E2', 'E3', 'E4', 'E5'] as EstacionId[]).map((estId) => {
                const est = ESTACIONES[estId];
                return (
                  <button
                    key={estId}
                    type="button"
                    onClick={() => handleSelectStationDirect(estId)}
                    className="p-3 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex items-center justify-between text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-300 font-mono font-bold flex items-center justify-center shrink-0">
                        {estId}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs group-hover:text-purple-300 transition truncate">
                          {est.nombre}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {est.subtitulo}
                        </div>
                      </div>
                    </div>

                    <div className="text-purple-400 font-bold text-xs flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition">
                      <span>Vincular</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode 2: QR Scanner / Token Input */}
        {activeTab === 'qr' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <p className="text-slate-300 text-xs">
              Apunta la cámara de este dispositivo al Código QR de la mesa de Logística para autorizar la estación:
            </p>

            <QrScannerComponent onScanSuccess={(code) => handleVerify(code)} />

            {/* Manual Token Fallback */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider block mb-2 flex items-center justify-between">
                <span>Ingresar Token de Logística</span>
                <span className="text-[10px] text-slate-500">RALLY-AUTH-EX-XXXX</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => {
                    setInputToken(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="Ej. RALLY-AUTH-E3-2649"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputToken.trim()) {
                      handleVerify(inputToken.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inputToken.trim()) handleVerify(inputToken.trim());
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Vincular
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom link to Logistics */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            PIN por defecto: rally2026
          </span>
          <button
            type="button"
            onClick={() => setActiveRole('logistica')}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
          >
            <span>Ir a Logística</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};
