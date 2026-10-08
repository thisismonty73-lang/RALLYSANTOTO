import React, { useState } from 'react';
import { RallyProvider, useRally } from './context/RallyContext';
import { Navbar } from './components/Navbar';
import { BroadcastBanner } from './components/common/BroadcastBanner';
import { ParticipantView } from './components/participant/ParticipantView';
import { MonitorView } from './components/monitor/MonitorView';
import { LogisticsDashboard } from './components/logistics/LogisticsDashboard';
import { TeamQrModal } from './components/participant/TeamQrModal';
import { DigitalNotepadModal } from './components/participant/DigitalNotepadModal';
import { RegisterTeamModal } from './components/auth/RegisterTeamModal';
import { LogisticsAuthModal } from './components/auth/LogisticsAuthModal';
import { 
  ShieldCheck, 
  UserCheck, 
  LayoutDashboard, 
  Sparkles,
  QrCode,
  BookOpen,
  Info,
  Lock,
  Smartphone
} from 'lucide-react';

function AppContent() {
  const { 
    activeRole, 
    setActiveRole, 
    currentTeam, 
    activeMonitorEstacion, 
    isLogisticaAuthed,
    dispositivoAutorizadoEstacion,
    seleccionarEquipoEnDispositivo
  } = useRally();

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [logisticsAuthOpen, setLogisticsAuthOpen] = useState(false);

  const handleSwitchToLogistica = () => {
    if (!isLogisticaAuthed) {
      setLogisticsAuthOpen(true);
    } else {
      setActiveRole('logistica');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        onOpenQrModal={() => setQrModalOpen(true)}
        onOpenNotepad={() => setNotepadOpen(true)}
        onOpenRegister={() => setRegisterModalOpen(true)}
      />

      {/* Global Broadcast / Emergency Notifications Banner */}
      <BroadcastBanner />

      {/* Main Role Content */}
      <main className="flex-1 pb-16">
        {activeRole === 'participante' && <ParticipantView />}
        {activeRole === 'monitor' && <MonitorView />}
        {activeRole === 'logistica' && <LogisticsDashboard />}
      </main>

      {/* Bottom Floating Quick Bar for Instant Role Switching (Mobile & Desktop) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1.5">
        <button
          onClick={() => setActiveRole('participante')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
            activeRole === 'participante'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Participante</span>
        </button>

        <button
          onClick={() => setActiveRole('monitor')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
            activeRole === 'monitor'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Monitor {dispositivoAutorizadoEstacion ? `(${dispositivoAutorizadoEstacion})` : '(QR)'}</span>
        </button>

        <button
          onClick={handleSwitchToLogistica}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
            activeRole === 'logistica'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isLogisticaAuthed ? (
            <LayoutDashboard className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>Logística</span>
        </button>
      </div>

      {/* Global Modals */}
      {currentTeam && (
        <>
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
        </>
      )}

      <RegisterTeamModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onRegisteredSuccess={(equipoId) => {
          seleccionarEquipoEnDispositivo(equipoId);
          setActiveRole('participante');
        }}
      />

      <LogisticsAuthModal
        isOpen={logisticsAuthOpen}
        onClose={() => setLogisticsAuthOpen(false)}
        onSuccess={() => {
          setLogisticsAuthOpen(false);
          setActiveRole('logistica');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono">Sistema Web Pasaporte Digital • Rally de Datos 2026</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Rotación Dinámica • 5 Estaciones • 25 Equipos • Pases QR de Seguridad
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RallyProvider>
      <AppContent />
    </RallyProvider>
  );
}
