import React from 'react';
import { Equipo, RegistroEstacion, EstacionId } from '../../types/rally';
import { ESTACIONES } from '../../data/mockData';
import { CheckCircle2, Clock, Lock, Sparkles, MapPin, Award, Shield } from 'lucide-react';

interface PassportBookletProps {
  equipo: Equipo;
  registros: RegistroEstacion[];
  onOpenStationDetails?: (estacionId: EstacionId) => void;
}

export const PassportBooklet: React.FC<PassportBookletProps> = ({
  equipo,
  registros,
  onOpenStationDetails
}) => {
  const teamRegistros = registros.filter(r => r.equipo_id === equipo.equipo_id);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      
      {/* Background Passport Aesthetic Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>

      {/* Top Header of Passport */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 relative z-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-inner">
            {equipo.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Pasaporte de Ruta Digital
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                Ruta {equipo.ruta_id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Secuencia oficial: {equipo.ruta_asignada.join(' ➔ ')}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-3 bg-slate-950/70 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Progreso</div>
            <div className="text-sm font-black text-white font-mono">
              {Math.min(5, equipo.estacion_actual_index)} / 5 Estaciones
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-black text-cyan-400 text-sm">
            {Math.round((Math.min(5, equipo.estacion_actual_index) / 5) * 100)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full my-5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${(Math.min(5, equipo.estacion_actual_index) / 5) * 100}%` }}
        />
      </div>

      {/* 5 Passport Pages / Station Stamp Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative z-10">
        {equipo.ruta_asignada.map((estId, stepIndex) => {
          const estConfig = ESTACIONES[estId];
          const isCompleted = stepIndex < equipo.estacion_actual_index;
          const isCurrent = stepIndex === equipo.estacion_actual_index;
          const isUpcoming = stepIndex > equipo.estacion_actual_index;

          const reg = teamRegistros.find(r => r.estacion_id === estId);

          return (
            <div
              key={estId}
              onClick={() => onOpenStationDetails?.(estId)}
              className={`rounded-2xl p-3.5 sm:p-4 border transition-all relative flex flex-col justify-between min-h-[220px] select-none ${
                isCompleted
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : isCurrent
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-950 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-500/30 animate-pulse-border'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-65'
              }`}
            >
              {/* Card Step Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                  PASO {stepIndex + 1}
                </span>

                {isCompleted ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SELLADO
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40 animate-pulse">
                    EN CURSO
                  </span>
                ) : (
                  <span className="text-slate-600">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Station Identity */}
              <div className="my-1">
                <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1">
                  <span>Estación {estConfig.numero}</span>
                </div>
                <h3 className="font-extrabold text-white text-xs leading-snug line-clamp-2 mt-0.5">
                  {estConfig.nombre}
                </h3>
              </div>

              {/* Middle Area: Official Stamp or In-Progress or Locked */}
              <div className="my-auto py-2 flex flex-col items-center justify-center text-center">
                {isCompleted ? (
                  /* Official Rubber Stamp Look */
                  <div className="w-full py-2 px-1 border-2 border-dashed border-emerald-400/80 rounded-xl text-emerald-300 transform -rotate-2 bg-emerald-950/30 shadow-inner">
                    <div className="text-[10px] tracking-widest font-mono font-black uppercase text-emerald-400">
                      ★ TIMBRE OFICIAL ★
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-300">
                      +{reg?.puntaje_obtenido ?? 0} PTS
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400/90 font-semibold">
                      {reg?.intentos_usados === 1 ? '1er INTENTO (100%)' :
                       reg?.intentos_usados === 2 ? '2do INTENTO (70%)' :
                       reg?.intentos_usados === 3 ? '3er INTENTO (40%)' : 'VALIDADO (0%)'}
                    </div>
                  </div>
                ) : isCurrent ? (
                  /* Current Station Radar Indicator */
                  <div className="w-full py-3 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                    <div className="w-7 h-7 mx-auto rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-1 animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] font-bold text-cyan-300">
                      {equipo.en_estacion_actual ? 'En validación con Monitor' : 'En camino / Resolver Enigma'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {equipo.en_estacion_actual ? '⏱️ Cronómetro activo' : 'Muestra tu QR al llegar'}
                    </div>
                  </div>
                ) : (
                  /* Locked Station */
                  <div className="py-4 text-center text-slate-600">
                    <Lock className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] font-mono block">En espera</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata or Captured Data */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                {isCompleted ? (
                  <>
                    <span className="truncate max-w-[80px]" title={reg?.dato_capturado}>
                      {reg?.dato_capturado ? `Dato: ${reg.dato_capturado}` : 'Aprobado'}
                    </span>
                    <span className="text-slate-500 shrink-0">
                      {reg?.tiempo_estacion_segundos ? `${reg.tiempo_estacion_segundos}s` : 'OK'}
                    </span>
                  </>
                ) : isCurrent ? (
                  <span className="text-cyan-400 font-semibold w-full text-center">
                    Puntos en juego: 100 pts
                  </span>
                ) : (
                  <span className="text-slate-600 w-full text-center">
                    Bloqueado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
