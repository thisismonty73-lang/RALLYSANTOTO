import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useRally } from '../../context/RallyContext';
import { PassportBooklet } from './PassportBooklet';
import { EnigmaCard } from './EnigmaCard';
import { TeamQrModal } from './TeamQrModal';
import { DigitalNotepadModal } from './DigitalNotepadModal';
import { BadgesDrawer } from './BadgesDrawer';
import { PostRallySummaryModal } from './PostRallySummaryModal';
import { ParticipantScanOnboarding } from './ParticipantScanOnboarding';
import { ProgressMotivationalPanel } from './ProgressMotivationalPanel';
import { ESTACIONES } from '../../data/mockData';
import { 
  QrCode, 
  BookOpen, 
  Award, 
  Clock, 
  Sparkles, 
  Users, 
  Trophy, 
  Compass, 
  MapPin,
  ChevronRight,
  LogOut,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ParticipantView: React.FC = () => {
  const { currentTeam, registros, desvincularEquipoParticipante, iniciarTiempoEquipo } = useRally();

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isStartingTimer, setIsStartingTimer] = useState(false);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  // Live ticking timer calculating elapsed seconds from hora_inicio_rally
  useEffect(() => {
    if (!currentTeam?.rally_iniciado || !currentTeam?.hora_inicio_rally) {
      setLiveElapsedSeconds(0);
      return;
    }

    const startMs = new Date(currentTeam.hora_inicio_rally).getTime();
    const updateTimer = () => {
      const now = currentTeam.estacion_actual_index >= 5 && currentTeam.hora_fin_rally
        ? new Date(currentTeam.hora_fin_rally).getTime()
        : Date.now();
      setLiveElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentTeam?.rally_iniciado, currentTeam?.hora_inicio_rally, currentTeam?.estacion_actual_index, currentTeam?.hora_fin_rally]);

  // If no team is activated on this device, prompt to scan Logistics QR Pass
  if (!currentTeam) {
    return <ParticipantScanOnboarding onSuccessCreated={() => {}} />;
  }

  const formatTiempo = (segs: number) => {
    const mins = Math.floor(segs / 60);
    const s = segs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const isCompletedRally = currentTeam.estacion_actual_index >= 5;
  const primeraEstacionId = currentTeam.ruta_asignada[0];

  const handleStartRallyTimer = async () => {
    if (!currentTeam) return;
    setIsStartingTimer(true);
    const res = await iniciarTiempoEquipo(currentTeam.equipo_id);
    setIsStartingTimer(false);
    if (res.ok) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  };

  const handleSalirEquipo = () => {
    if (window.confirm(`¿Deseas cambiar de equipo o salir de "${currentTeam.nombre}" en este dispositivo?\n\nPodrás seleccionar cualquier otro equipo o crear uno nuevo en cualquier momento.`)) {
      desvincularEquipoParticipante();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Prominent CTA Banner when team timer has NOT started yet */}
      {!currentTeam.rally_iniciado && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10 text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-xl shadow-amber-500/30 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                  <Play className="w-8 h-8 fill-amber-400" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase mb-1.5">
                  <Clock className="w-3.5 h-3.5" /> Cronómetro En Espera
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  ¡Pasaporte Oficial Generado! Activa tu Carrera
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
                  Tu equipo <strong className="text-white">{currentTeam.nombre}</strong> está listo en la <strong className="text-purple-300">Ruta {currentTeam.ruta_id}</strong>. Para arrancar oficialmente tu tiempo y comenzar hacia la <strong className="text-cyan-300">{ESTACIONES[primeraEstacionId]?.nombre}</strong>, presiona el botón a continuación:
                </p>
              </div>
            </div>

            <button
              onClick={handleStartRallyTimer}
              disabled={isStartingTimer}
              className="shrink-0 flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-7 sm:px-9 py-4 rounded-2xl text-sm sm:text-base shadow-2xl shadow-amber-500/40 transition transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
            >
              <Play className="w-5 h-5 fill-slate-950 shrink-0" />
              <span>⚡ INICIAR RALLY Y ACTIVAR TIEMPO</span>
            </button>
          </div>
        </div>
      )}

      {/* Participant Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        
        {/* Subtle glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          
          {/* Team Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl sm:text-4xl select-none">
                {currentTeam.avatar}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                  {currentTeam.equipo_id}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                  Ruta {currentTeam.ruta_id}
                </span>
                {currentTeam.rally_iniciado ? (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    EN CARRERA
                  </span>
                ) : (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                    ESPERANDO INICIO
                  </span>
                )}
                {isCompletedRally && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" /> FINALIZADO
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {currentTeam.nombre}
              </h1>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentTeam.integrantes.join(' • ')}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Interactive Actions */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Score pill */}
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Puntos Totales</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {currentTeam.puntaje_total} <span className="text-xs text-slate-500 font-normal">pts</span>
              </span>
            </div>

            {/* Official Live Timer pill */}
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block flex items-center gap-1">
                {currentTeam.rally_iniciado ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Tiempo de Carrera</span>
                  </>
                ) : (
                  <span>Tiempo Oficial</span>
                )}
              </span>
              <span className="text-lg font-black text-cyan-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400 inline" />
                {currentTeam.rally_iniciado ? formatTiempo(liveElapsedSeconds) : '00m 00s'}
              </span>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBadgesOpen(true)}
                className="relative p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition"
                title="Ver medallas e insignias"
              >
                <Award className="w-5 h-5 text-amber-400" />
                {currentTeam.insignias.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center font-mono">
                    {currentTeam.insignias.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setNotepadOpen(true)}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition"
                title="Abrir bloc de notas y calculadora"
              >
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </button>

              <button
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Mi QR</span>
              </button>

              {/* Explicit Exit / Logout Button */}
              <button
                onClick={handleSalirEquipo}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-850 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 border border-slate-700/80 text-xs font-semibold transition"
                title="Salir del equipo en este dispositivo (Requerirá QR para volver a entrar)"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rally Completed Banner Action */}
        {isCompletedRally && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>¡Completaste tu ruta oficial! Tu pasaporte está listo para certificación final.</span>
            </div>
            <button
              onClick={() => setSummaryOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 justify-center"
            >
              <Trophy className="w-4 h-4" />
              Ver Resumen & Certificado Oficial
            </button>
          </div>
        )}
      </div>

      {/* Visual Progress & Motivational Panel (Recharts) */}
      <ProgressMotivationalPanel 
        equipo={currentTeam}
        registros={registros}
      />

      {/* Passport Stamps Booklet */}
      <PassportBooklet 
        equipo={currentTeam} 
        registros={registros} 
      />

      {/* Navigation Enigma for Next Station & GPS Radar */}
      <EnigmaCard
        equipo={currentTeam}
        onOpenQrModal={() => setQrModalOpen(true)}
        onOpenNotepad={() => setNotepadOpen(true)}
      />

      {/* Modals */}
      <TeamQrModal
        equipo={currentTeam}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      <DigitalNotepadModal
        equipo={currentTeam}
        isOpen={notepadOpen}
        onClose={() => setNotepadOpen(false)}
      />

      <BadgesDrawer
        equipo={currentTeam}
        isOpen={badgesOpen}
        onClose={() => setBadgesOpen(false)}
      />

      <PostRallySummaryModal
        equipo={currentTeam}
        registros={registros}
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </div>
  );
};
