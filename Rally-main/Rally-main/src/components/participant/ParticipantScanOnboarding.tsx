import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useRally } from '../../context/RallyContext';
import { QrScannerComponent } from '../monitor/QrScannerComponent';
import { AVATARES_DISPONIBLES, RUTAS_BASE, ESTACIONES } from '../../data/mockData';
import { TeamCreationPass, RutaId } from '../../types/rally';
import { 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ArrowRight, 
  Compass, 
  Shield, 
  HelpCircle,
  Smartphone,
  LogIn,
  KeyRound,
  PlusCircle,
  UserCheck
} from 'lucide-react';

interface ParticipantScanOnboardingProps {
  onSuccessCreated: () => void;
}

export const ParticipantScanOnboarding: React.FC<ParticipantScanOnboardingProps> = ({ onSuccessCreated }) => {
  const { 
    equipos,
    passesEquipos, 
    validarPassCreacionEquipo, 
    activarEquipoConPass,
    crearEquipoDirecto,
    seleccionarEquipoEnDispositivo,
    reingresarEquipoConQr
  } = useRally();

  const [activeTab, setActiveTab] = useState<'crear' | 'existente' | 'qr'>('crear');
  const [activePass, setActivePass] = useState<TeamCreationPass | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputTokenManual, setInputTokenManual] = useState('');

  // Form inputs for creating team
  const [nombre, setNombre] = useState('');
  const [integrante1, setIntegrante1] = useState('');
  const [integrante2, setIntegrante2] = useState('');
  const [integrante3, setIntegrante3] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaId | 'auto'>('auto');

  // Direct Team Creation (For new teams on external devices)
  const handleDirectCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa el nombre de tu equipo.');
      return;
    }

    const integrantes = [integrante1, integrante2, integrante3].filter(i => i.trim().length > 0);
    if (integrantes.length === 0) {
      setErrorMsg('Por favor ingresa al menos un integrante (líder del equipo).');
      return;
    }

    setLoading(true);
    const rutaId = rutaSeleccionada === 'auto' ? undefined : rutaSeleccionada;
    const res = await crearEquipoDirecto(nombre.trim(), integrantes, avatar, rutaId);
    setLoading(false);

    if (res.ok) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setSuccessMsg(res.mensaje);
      setTimeout(() => {
        onSuccessCreated();
      }, 900);
    } else {
      setErrorMsg(res.mensaje);
    }
  };

  // Join Existing Team (For teammates joining on other phones)
  const handleSelectExistingTeam = (equipoId: string) => {
    seleccionarEquipoEnDispositivo(equipoId);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    onSuccessCreated();
  };

  // Smart scanner: Handles BOTH Team Creation Pass AND Re-entry via existing Team QR
  const handleScanCode = async (scannedText: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Try to re-login into existing team first
    const reLogin = await reingresarEquipoConQr(scannedText);
    if (reLogin.ok && reLogin.equipo) {
      setSuccessMsg(reLogin.mensaje);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        onSuccessCreated();
      }, 1000);
      return;
    }

    // 2. Try to validate as new Team Creation Pass from Logistics
    const result = validarPassCreacionEquipo(scannedText);
    if (result.ok && result.pass) {
      setActivePass(result.pass);
      setActiveTab('crear');
      if (result.pass.ruta_id) {
        setRutaSeleccionada(result.pass.ruta_id);
      }
      return;
    }

    // Neither: Check if it's an exact team code in existing teams (e.g. EQ-01, EQ-26)
    const matchEq = equipos.find(e => e.equipo_id.toUpperCase() === scannedText.trim().toUpperCase());
    if (matchEq) {
      handleSelectExistingTeam(matchEq.equipo_id);
      return;
    }

    setErrorMsg(
      result.mensaje || 'Código no reconocido. Ingresa el código EQ-XX de tu equipo o completa el formulario para crear uno nuevo.'
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase mb-2">
            Dispositivo de Participante
          </div>

          <h2 className="text-2xl font-black text-white">
            Ingreso al Rally de Datos 2026
          </h2>
          <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
            Activa el pasaporte digital para este dispositivo. Puedes crear un nuevo equipo, unirte a un equipo existente o escanear un código QR.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('crear')}
            className={`py-2 px-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'crear'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="truncate">Crear Equipo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('existente')}
            className={`py-2 px-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'existente'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">Unirme ({equipos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="truncate">Escanear QR</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Create New Team Directly */}
        {activeTab === 'crear' && (
          <form onSubmit={handleDirectCreate} className="space-y-4 text-xs animate-fade-in">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                Crea tu equipo desde este dispositivo. El sistema te asignará automáticamente un <strong>Pasaporte Digital Oficial</strong> y una de las <strong>5 Rutas Cíclicas</strong> para tu recorrido.
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">
                Avatar del Equipo:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATARES_DISPONIBLES.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition border ${
                      avatar === av
                        ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/40 scale-110'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Name */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                Nombre del Equipo:
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Algoritmo Voraz, Los Decodificadores..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Integrantes */}
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Integrantes (Hasta 3 participantes):
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={integrante1}
                  onChange={(e) => setIntegrante1(e.target.value)}
                  placeholder="Participante 1 (Líder del equipo)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  value={integrante2}
                  onChange={(e) => setIntegrante2(e.target.value)}
                  placeholder="Participante 2 (Opcional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  value={integrante3}
                  onChange={(e) => setIntegrante3(e.target.value)}
                  placeholder="Participante 3 (Opcional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Route selector */}
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                Asignación de Ruta:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRutaSeleccionada('auto')}
                  className={`p-2 rounded-xl border text-center transition ${
                    rutaSeleccionada === 'auto'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono">Auto</div>
                  <div className="text-[9px] text-slate-500">Balanceada</div>
                </button>
                {(['A', 'B', 'C', 'D', 'E'] as RutaId[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRutaSeleccionada(r)}
                    className={`p-2 rounded-xl border text-center transition ${
                      rutaSeleccionada === r
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-mono font-bold">Ruta {r}</div>
                    <div className="text-[9px] text-slate-500">{RUTAS_BASE[r][0]}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50"
            >
              {loading ? (
                <span>Creando pasaporte...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Activar Mi Pasaporte en este Dispositivo</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Select Existing Team (Join) */}
        {activeTab === 'existente' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <p className="text-slate-300 text-xs">
              Si tu equipo ya fue creado (por tu líder o en otra pantalla), selecciónalo para ingresar a su pasaporte desde este dispositivo:
            </p>

            {equipos.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No hay equipos creados todavía</p>
                <p className="text-[11px] mt-1 text-slate-500">
                  Ve a la pestaña "Crear Equipo" para registrar el primer equipo del Rally.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {equipos.map((eq) => (
                  <div
                    key={eq.equipo_id}
                    className="p-3 bg-slate-950/80 hover:bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{eq.avatar}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate text-xs">
                          {eq.nombre}
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                          {eq.equipo_id} • Ruta {eq.ruta_id} • {eq.puntaje_total} pts
                        </div>
                        {eq.integrantes.length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {eq.integrantes.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectExistingTeam(eq.equipo_id)}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ingresar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick search / code input */}
            <div className="pt-3 border-t border-slate-800/80">
              <label className="text-slate-400 text-[11px] font-mono block mb-1">
                ¿Tienes el código directo de tu equipo?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputTokenManual}
                  onChange={(e) => setInputTokenManual(e.target.value)}
                  placeholder="Ej. EQ-01, EQ-26..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputTokenManual.trim()) {
                      handleScanCode(inputTokenManual.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inputTokenManual.trim()) handleScanCode(inputTokenManual.trim());
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scan QR */}
        {activeTab === 'qr' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <p className="text-slate-300 text-xs">
              Apunta la cámara de este dispositivo al código QR de tu equipo o al Pase oficial emitido por Logística:
            </p>

            <QrScannerComponent onScanSuccess={handleScanCode} />

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <label className="text-slate-400 font-mono text-[11px] block mb-1.5 uppercase font-bold">
                O escribe el token / código manualmente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputTokenManual}
                  onChange={(e) => setInputTokenManual(e.target.value)}
                  placeholder="Ej. EQ-26 o RALLY-TEAM-PASS-A-01"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inputTokenManual.trim()) handleScanCode(inputTokenManual.trim());
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
