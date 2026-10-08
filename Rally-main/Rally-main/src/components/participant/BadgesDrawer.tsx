import React from 'react';
import { Equipo } from '../../types/rally';
import { INSIGNIAS_CATALOG } from '../../data/mockData';
import { Award, CheckCircle2, Lock, X } from 'lucide-react';

interface BadgesDrawerProps {
  equipo: Equipo;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgesDrawer: React.FC<BadgesDrawerProps> = ({ equipo, isOpen, onClose }) => {
  if (!isOpen) return null;

  const earnedSet = new Set(equipo.insignias);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">
                Insignias & Logros Digitales
              </h3>
              <p className="text-xs text-slate-400">
                {earnedSet.size} de {INSIGNIAS_CATALOG.length} medallas desbloqueadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {INSIGNIAS_CATALOG.map((insignia) => {
            const isEarned = earnedSet.has(insignia.id);

            return (
              <div
                key={insignia.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isEarned
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                    isEarned
                      ? `bg-gradient-to-br ${insignia.color} text-white shadow-lg`
                      : 'bg-slate-850 text-slate-500 border border-slate-800'
                  }`}
                >
                  {isEarned ? insignia.icono : <Lock className="w-5 h-5 text-slate-600" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${isEarned ? 'text-white' : 'text-slate-400'}`}>
                      {insignia.nombre}
                    </h4>
                    {isEarned ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Desbloqueada
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Bloqueada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {insignia.descripcion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
