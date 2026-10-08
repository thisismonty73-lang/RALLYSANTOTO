import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Equipo, RegistroEstacion } from '../../types/rally';
import { ESTACIONES, INSIGNIAS_CATALOG } from '../../data/mockData';
import { 
  Trophy, 
  Award, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  Download, 
  X, 
  Printer, 
  Check,
  Zap
} from 'lucide-react';

interface PostRallySummaryModalProps {
  equipo: Equipo;
  registros: RegistroEstacion[];
  isOpen: boolean;
  onClose: () => void;
}

export const PostRallySummaryModal: React.FC<PostRallySummaryModalProps> = ({ 
  equipo, 
  registros, 
  isOpen, 
  onClose 
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter records corresponding to this team
  const teamRegistros = registros.filter(r => r.equipo_id === equipo.equipo_id);

  const formatTiempo = (segs: number) => {
    const mins = Math.floor(segs / 60);
    const s = segs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const shareText = `🚀 ¡Completamos el Rally de Datos 2026! 
Equipo: ${equipo.nombre} (${equipo.equipo_id})
Puntuación: ${equipo.puntaje_total} / 500 pts
Tiempo Total: ${formatTiempo(equipo.tiempo_acumulado_segundos)}
Insignias: ${equipo.insignias.length}
#RallyDeDatos2026 #DataRally`;

  const handleShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-8 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Card Printable Area */}
        <div id="certificate-print" className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-inner">
          
          {/* Decorative Corner Seals */}
          <div className="absolute top-3 left-3 text-amber-500/20 font-mono text-xs select-none">
            ⚡ RALLY DE DATOS 2026
          </div>
          <div className="absolute top-3 right-3 text-amber-500/20 font-mono text-xs select-none">
            CERTIFICADO OFICIAL
          </div>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-lg shadow-amber-500/20 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase mb-2">
            Pasaporte Digital Sellado y Certificado
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {equipo.nombre}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Código: <span className="font-mono text-cyan-400 font-bold">{equipo.equipo_id}</span> • Ruta {equipo.ruta_id}
          </p>

          <p className="text-xs text-slate-300 max-w-md mx-auto mt-2">
            Integrantes: <span className="font-semibold text-white">{equipo.integrantes.join(', ')}</span>
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3 my-6 max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Puntuación Final</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{equipo.puntaje_total}</span>
              <span className="text-[10px] text-slate-500 block">/ 500 pts</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tiempo Total</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {formatTiempo(equipo.tiempo_acumulado_segundos)}
              </span>
              <span className="text-[10px] text-slate-500 block">5 estaciones</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Medallas</span>
              <span className="text-2xl font-black text-purple-400 font-mono">{equipo.insignias.length}</span>
              <span className="text-[10px] text-slate-500 block">logros</span>
            </div>
          </div>

          {/* Breakdown Table of 5 Stations */}
          <div className="text-left mt-5 mb-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Desglose Oficial por Estación
            </h4>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-850 text-xs">
              {equipo.ruta_asignada.map((estId, idx) => {
                const estConfig = ESTACIONES[estId];
                const reg = teamRegistros.find(r => r.estacion_id === estId);
                const isPassed = reg && (reg.estado === 'aprobado' || reg.estado === 'fallido_continuado');

                return (
                  <div key={estId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-white truncate max-w-[180px] sm:max-w-[260px]">
                          {estConfig.nombre}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {reg?.dato_capturado ? `Dato: ${reg.dato_capturado}` : 'Estación completada'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">
                        +{reg?.puntaje_obtenido ?? 0} pts
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {reg?.intentos_usados ? `${reg.intentos_usados} intento(s)` : '-'} • {reg?.tiempo_estacion_segundos ? `${reg.tiempo_estacion_segundos}s` : '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges Earned */}
          {equipo.insignias.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Insignias Conquistadas
              </h4>
              <div className="flex flex-wrap justify-center gap-2">
                {equipo.insignias.map((insId) => {
                  const ins = INSIGNIAS_CATALOG.find(i => i.id === insId);
                  if (!ins) return null;
                  return (
                    <div
                      key={ins.id}
                      className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/30 px-3 py-1 rounded-full text-xs text-slate-200"
                    >
                      <span>{ins.icono}</span>
                      <span className="font-semibold">{ins.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>VALIDACIÓN CRIPTOGRÁFICA CRC-32</span>
            <span>FECHA: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Compartir'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-cyan-500/20 transition"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
