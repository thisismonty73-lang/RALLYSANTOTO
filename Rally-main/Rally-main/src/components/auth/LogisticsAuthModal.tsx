import React, { useState } from 'react';
import { useRally } from '../../context/RallyContext';
import { Lock, ShieldAlert, KeyRound, ArrowRight, X, CheckCircle2 } from 'lucide-react';

interface LogisticsAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LogisticsAuthModal: React.FC<LogisticsAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { loginLogistica } = useRally();
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginLogistica(passwordInput);
    if (ok) {
      setErrorMsg(false);
      setPasswordInput('');
      onSuccess();
    } else {
      setErrorMsg(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold uppercase mb-2">
            Control de Acceso Restringido
          </div>
          
          <h3 className="text-xl font-black text-white">
            Autenticación de Logística
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Ingresa la clave oficial del comité organizador para acceder a la consola central y generador de pases.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Contraseña incorrecta. Acceso denegado a la consola de logística.</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 font-mono">
              Contraseña de Logística:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(false);
                }}
                placeholder="Ingresa la contraseña..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Clave configurada para el Rally 2026.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Acceder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500 font-mono">
            RALLY DE DATOS 2026 • SEGURIDAD CRIPTOGRÁFICA
          </span>
        </div>
      </div>
    </div>
  );
};
