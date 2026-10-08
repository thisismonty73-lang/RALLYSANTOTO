import React, { useState } from 'react';
import { Equipo, EstacionId } from '../../types/rally';
import { ESTACIONES } from '../../data/mockData';
import { useRally } from '../../context/RallyContext';
import { 
  Compass, 
  HelpCircle, 
  MapPin, 
  Navigation, 
  Radio, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  ExternalLink,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface EnigmaCardProps {
  equipo: Equipo;
  onOpenQrModal: () => void;
  onOpenNotepad: () => void;
}

export const EnigmaCard: React.FC<EnigmaCardProps> = ({ equipo, onOpenQrModal, onOpenNotepad }) => {
  const { 
    calcularDistanciaAEstacion, 
    gpsSimulado, 
    toggleGpsSimulado, 
    userGps, 
    globalConfig 
  } = useRally();

  const [mostrarPistaExtra, setMostrarPistaExtra] = useState(false);

  // If already finished 5 stations
  if (equipo.estacion_actual_index >= 5) {
    return (
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/10">
          🏆
        </div>
        <h3 className="text-2xl font-black text-white">
          ¡Rally de Datos Completado con Éxito!
        </h3>
        <p className="text-slate-300 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
          Has completado las 5 estaciones de tu circuito oficial. Tu pasaporte digital está sellado y certificado por todos los monitores del evento.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-amber-500/20">
          Puntaje Final: {equipo.puntaje_total} pts
        </div>
      </div>
    );
  }

  const estacionActualId = equipo.ruta_asignada[equipo.estacion_actual_index];
  const estacionConfig = ESTACIONES[estacionActualId];
  const { distanciaMetros, dentroDelRadio } = calcularDistanciaAEstacion(estacionActualId);

  // Station specific enigmatic riddle
  const enigma = estacionConfig.enigmaLlegada;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
      
      {/* Background radial accent */}
      <div 
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: estacionConfig.color }}
      />

      {/* Header with Station Target */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Pista de Orientación • Paso {equipo.estacion_actual_index + 1} de 5
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Enigma de Navegación hacia Estación {estacionConfig.numero}
            </h3>
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-2">
          {equipo.en_estacion_actual ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              En la estación (Monitor atendiendo)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Búsqueda en curso
            </span>
          )}
        </div>
      </div>

      {/* The Riddle / Enigma Text */}
      <div className="my-5 bg-gradient-to-r from-purple-950/40 via-slate-950/80 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-inner relative">
        <div className="text-[10px] uppercase font-mono font-extrabold text-purple-400 tracking-widest mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Acertijo de Entorno (Ubicación No Explícita):
        </div>

        <blockquote className="text-base sm:text-xl font-bold text-slate-100 italic leading-relaxed py-1">
          "{enigma}"
        </blockquote>

        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
          <span>💡</span> Deduce el laboratorio o módulo técnico en el campus correspondiente a este principio físico o lógico.
        </p>

        {/* Extra Hint Accordion */}
        <div className="mt-3 pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs">
          <button
            onClick={() => setMostrarPistaExtra(!mostrarPistaExtra)}
            className="text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {mostrarPistaExtra ? 'Ocultar pista de contexto' : '¿Necesitas una pista de contexto?'}
          </button>

          {mostrarPistaExtra && (
            <span className="text-[11px] text-slate-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              Reto: {estacionConfig.descripcionReto}
            </span>
          )}
        </div>
      </div>

      {/* GPS Anti-Cheat Radar Module */}
      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${dentroDelRadio ? 'text-emerald-400' : 'text-amber-400'}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Módulo Anti-Trampas • Radar de Geolocalización (GPS)
            </h4>
          </div>

          {/* Toggle Simulator for Web Demo */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Simulador de Radio:</span>
            <button
              onClick={() => toggleGpsSimulado()}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono font-semibold"
              title="Alternar entre coordenadas reales y radio simulado de prueba"
            >
              {gpsSimulado ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400">Simulado (En Rango)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                  <span>GPS Real</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Distance Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Distancia Estimada</span>
            <span className="text-lg font-black text-white font-mono flex items-baseline gap-1">
              {distanciaMetros} <span className="text-xs text-slate-400 font-normal">metros</span>
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Perímetro Permitido</span>
            <span className="text-lg font-black text-cyan-400 font-mono flex items-baseline gap-1">
              ≤ {globalConfig.distanciaMaximaPermitidaMetros} <span className="text-xs text-slate-400 font-normal">metros</span>
            </span>
          </div>

          <div className={`rounded-xl p-3 border flex items-center gap-2.5 ${
            dentroDelRadio 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            {dentroDelRadio ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs leading-tight">
                  <span className="font-bold block">Dentro del perímetro</span>
                  <span className="text-[10px] text-emerald-400/80">Validación de QR autorizada</span>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs leading-tight">
                  <span className="font-bold block">Fuera de radio</span>
                  <span className="text-[10px] text-amber-400/80">Acércate más a la estación</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Al llegar al punto físico, muestra tu pasaporte QR al <strong className="text-white">Monitor de la Estación {estacionConfig.numero}</strong>.
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenNotepad}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            <span>📝</span> Bloc de Notas & Matriz
          </button>

          <button
            onClick={onOpenQrModal}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Mostrar QR para Escanear
          </button>
        </div>
      </div>
    </div>
  );
};
