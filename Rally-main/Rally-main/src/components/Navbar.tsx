import React, { useState } from 'react';
import { useRally } from '../context/RallyContext';
import { Role, EstacionId } from '../types/rally';
import { ESTACIONES, PASSWORD_LOGISTICA_FIJA } from '../data/mockData';
import { LogisticsAuthModal } from './auth/LogisticsAuthModal';
import { ShareDevicesModal } from './common/ShareDevicesModal';
import { 
  QrCode, 
  ShieldCheck, 
  LayoutDashboard, 
  UserCheck, 
  Bell, 
  Sparkles, 
  Clock, 
  Menu, 
  X,
  Radio,
  RotateCcw,
  Lock,
  Smartphone,
  LogOut,
  Share2
} from 'lucide-react';

interface NavbarProps {
  onOpenQrModal?: () => void;
  onOpenNotepad?: () => void;
  onOpenRegister?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQrModal, onOpenNotepad, onOpenRegister }) => {
  const { 
    activeRole, 
    setActiveRole, 
    currentTeam, 
    equipos, 
    activeMonitorEstacion, 
    setActiveMonitorEstacion,
    broadcasts,
    reiniciarDatosRally,
    poblarSimulacionCompleta,
    isLogisticaAuthed,
    dispositivoAutorizadoEstacion,
    desvincularEquipoParticipante
  } = useRally();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const activeBroadcastCount = broadcasts.filter(b => b.activo).length;

  const handleSelectRoleLogistica = () => {
    if (!isLogisticaAuthed) {
      setShowAuthModal(true);
    } else {
      setActiveRole('logistica');
    }
  };

  const handleSalirEquipo = () => {
    if (!currentTeam) return;
    if (window.confirm(`¿Deseas salir del equipo "${currentTeam.nombre}" en este dispositivo?\n\nPara volver a ingresar más tarde, deberás escanear el código QR de tu equipo.`)) {
      desvincularEquipoParticipante();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Event Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  RALLY DE DATOS
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Pasaporte Digital • Rotación Dinámica & Telemetría
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveRole('participante')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'participante'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Participante
            </button>

            <button
              onClick={() => setActiveRole('monitor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'monitor'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Monitor {dispositivoAutorizadoEstacion ? `(${dispositivoAutorizadoEstacion})` : '(QR)'}
            </button>

            <button
              onClick={handleSelectRoleLogistica}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'logistica'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isLogisticaAuthed ? (
                <LayoutDashboard className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              Logística
            </button>
          </div>

          {/* Role Specific Actions & Team Info (No dropdown of other teams) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeRole === 'participante' && (
              <div className="flex items-center gap-2">
                {currentTeam ? (
                  <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 shadow-sm">
                    <span className="text-base select-none">{currentTeam.avatar}</span>
                    <div className="text-left hidden sm:block">
                      <div className="font-bold text-white leading-none max-w-[140px] truncate">{currentTeam.nombre}</div>
                      <div className="text-[10px] text-cyan-400 font-mono leading-none mt-0.5">
                        {currentTeam.equipo_id} • Ruta {currentTeam.ruta_id}
                      </div>
                    </div>
                    <button
                      onClick={handleSalirEquipo}
                      className="ml-1 p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg transition"
                      title="Salir del equipo en este dispositivo (Requerirá QR para volver a entrar)"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl px-3 py-1.5 text-xs font-mono font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ingreso con QR</span>
                  </div>
                )}
              </div>
            )}

            {activeRole === 'monitor' && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                {dispositivoAutorizadoEstacion ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Mesa {dispositivoAutorizadoEstacion}
                  </span>
                ) : (
                  <span className="text-purple-300 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> Requiere QR
                  </span>
                )}
              </div>
            )}

            {/* Quick QR Icon for Team */}
            {activeRole === 'participante' && onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                title="Mostrar mi código QR para escaneo"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Mi QR</span>
              </button>
            )}

            {/* Share to Other Devices Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Compartir enlace o código QR para otros celulares y dispositivos"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Compartir / QR</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cambiar Rol Activo
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setActiveRole('participante'); setMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold text-center border ${
                activeRole === 'participante'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              Participante
            </button>
            <button
              onClick={() => { setActiveRole('monitor'); setMobileMenuOpen(false); }}
              className={`p-2 rounded-lg text-xs font-bold text-center border ${
                activeRole === 'monitor'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              Monitor
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSelectRoleLogistica();
              }}
              className={`p-2 rounded-lg text-xs font-bold text-center border ${
                activeRole === 'logistica'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              Logística
            </button>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setShowShareModal(true);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Compartir Enlace / QR para Otros Celulares</span>
          </button>
        </div>
      )}

      {/* Logistics Auth Modal */}
      <LogisticsAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setActiveRole('logistica');
        }}
      />

      {/* Share / Multi-Device Modal */}
      <ShareDevicesModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </header>
  );
};
