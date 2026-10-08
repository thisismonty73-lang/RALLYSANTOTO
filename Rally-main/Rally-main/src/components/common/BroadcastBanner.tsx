import React from 'react';
import { useRally } from '../../context/RallyContext';
import { Bell, AlertTriangle, Clock, X, Info } from 'lucide-react';

export const BroadcastBanner: React.FC = () => {
  const { broadcasts, descartarBroadcast } = useRally();

  const activeMessages = broadcasts.filter(b => b.activo);

  if (activeMessages.length === 0) return null;

  return (
    <div className="w-full space-y-2 max-w-5xl mx-auto px-4 pt-4">
      {activeMessages.slice(0, 2).map((item) => {
        const isUrgent = item.tipo === 'alerta' || item.tipo === 'tiempo_limite';

        return (
          <div
            key={item.id}
            className={`relative rounded-xl p-3.5 border transition-all flex items-start gap-3 shadow-lg ${
              isUrgent
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-100 shadow-rose-950/50 animate-pulse'
                : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-100 shadow-cyan-950/30'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${isUrgent ? 'bg-rose-600/30 text-rose-300' : 'bg-cyan-600/30 text-cyan-300'}`}>
              {item.tipo === 'tiempo_limite' ? (
                <Clock className="w-4 h-4 animate-spin text-rose-300" />
              ) : isUrgent ? (
                <AlertTriangle className="w-4 h-4 text-rose-300" />
              ) : (
                <Bell className="w-4 h-4 text-cyan-300" />
              )}
            </div>

            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                  isUrgent ? 'bg-rose-500 text-white' : 'bg-cyan-500/30 text-cyan-200'
                }`}>
                  {item.tipo === 'tiempo_limite' ? 'TIEMPO LÍMITE' : item.tipo === 'alerta' ? 'AVISO URGENTE' : 'COMUNICADO'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1">{item.titulo}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{item.mensaje}</p>
            </div>

            <button
              onClick={() => descartarBroadcast(item.id)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
