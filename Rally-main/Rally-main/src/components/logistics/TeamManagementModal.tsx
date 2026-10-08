import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRally } from '../../context/RallyContext';
import { RutaId, Equipo, TeamCreationPass } from '../../types/rally';
import { AVATARES_DISPONIBLES, RUTAS_BASE } from '../../data/mockData';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  QrCode, 
  Check, 
  X, 
  Sparkles, 
  Shuffle, 
  Shield,
  Layers,
  Search,
  CheckCircle2,
  Maximize2,
  Smartphone,
  Printer
} from 'lucide-react';
import { TeamQrModal } from '../participant/TeamQrModal';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    equipos, 
    crearEquipoPorLogistica, 
    eliminarEquipo, 
    passesEquipos,
    generarNuevoPassEquipo 
  } = useRally();

  const [activeTab, setActiveTab] = useState<'pases' | 'crear' | 'lista'>('pases');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected pass to show full screen QR for participant scanning
  const [inspectPass, setInspectPass] = useState<TeamCreationPass | null>(null);
  const [passQrUrl, setPassQrUrl] = useState<string>('');

  // Form State
  const [nombre, setNombre] = useState('');
  const [integrante1, setIntegrante1] = useState('');
  const [integrante2, setIntegrante2] = useState('');
  const [integrante3, setIntegrante3] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [rutaModo, setRutaModo] = useState<'auto' | RutaId>('auto');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // QR Modal for team inspect
  const [inspectTeam, setInspectTeam] = useState<Equipo | null>(null);

  // Generate QR image for inspect pass
  useEffect(() => {
    if (inspectPass) {
      const payload = JSON.stringify({
        type: 'RALLY_TEAM_CREATION_PASS',
        token: inspectPass.token,
        equipo_id: inspectPass.equipo_id_asignado,
        ruta_id: inspectPass.ruta_id
      });

      QRCode.toDataURL(payload, {
        width: 380,
        margin: 2,
        color: {
          dark: '#030712',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
      .then(url => setPassQrUrl(url))
      .catch(console.warn);
    } else {
      setPassQrUrl('');
    }
  }, [inspectPass]);

  if (!isOpen) return null;

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const integrantes = [integrante1, integrante2, integrante3].filter(i => i.trim().length > 0);
    const rutaFinal = rutaModo === 'auto' ? undefined : rutaModo;

    const res = crearEquipoPorLogistica(nombre.trim(), integrantes, avatar, rutaFinal);
    setSuccessNotice(`¡Equipo ${res.equipo.nombre} (${res.equipo.equipo_id}) creado y asignado a Ruta ${res.equipo.ruta_id}!`);
    
    setNombre('');
    setIntegrante1('');
    setIntegrante2('');
    setIntegrante3('');

    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const filteredTeams = equipos.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.equipo_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availablePasses = passesEquipos.filter(p => !p.utilizado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white">
                Gestión y Creación de Equipos (Logística)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                {equipos.length}/25 Registrados
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Genera pases QR para que los participantes escaneen desde sus celulares y activen sus equipos con ruta balanceada.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            onClick={() => setActiveTab('pases')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pases'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pases QR para Participantes ({availablePasses.length} Disponibles)</span>
          </button>

          <button
            onClick={() => setActiveTab('crear')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'crear'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Manualmente</span>
          </button>

          <button
            onClick={() => setActiveTab('lista')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'lista'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Equipos Registrados ({equipos.length})</span>
          </button>
        </div>

        {/* Tab 0: Pases QR de Registro (Logistics generates QR for participants) */}
        {activeTab === 'pases' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <strong className="text-white block font-mono">Pases QR Balanceados (5 por Ruta: A, B, C, D, E)</strong>
                <span className="text-slate-400 text-[11px]">
                  Haz clic en cualquier pase para mostrar el código QR en pantalla y permitir al participante escanearlo con su celular.
                </span>
              </div>
              <button
                onClick={() => generarNuevoPassEquipo()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 transition"
              >
                + Generar Otro Pase
              </button>
            </div>

            {/* Passes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {passesEquipos.map((pass) => {
                const isUsed = pass.utilizado;
                return (
                  <button
                    key={pass.pass_id}
                    onClick={() => setInspectPass(pass)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between min-h-[105px] ${
                      isUsed
                        ? 'bg-slate-950/40 border-slate-850 text-slate-600 opacity-60'
                        : 'bg-slate-950 hover:bg-slate-850 border-amber-500/30 hover:border-amber-400 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-amber-400">
                          {pass.equipo_id_asignado}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                          Ruta {pass.ruta_id}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isUsed ? `Vinculado: ${pass.nombre_equipo_creado}` : 'Disponible'}
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isUsed ? 'Ver QR' : 'Mostrar QR'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Create Form */}
        {activeTab === 'crear' && (
          <div>
            {successNotice && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{successNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
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
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/30 scale-110'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Nombre del Equipo:
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Los Fibonacci, Vector Matrix..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Integrantes del Equipo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={integrante1}
                    onChange={(e) => setIntegrante1(e.target.value)}
                    placeholder="Líder / Integrante 1"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    value={integrante2}
                    onChange={(e) => setIntegrante2(e.target.value)}
                    placeholder="Integrante 2"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    value={integrante3}
                    onChange={(e) => setIntegrante3(e.target.value)}
                    placeholder="Integrante 3"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <label className="text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                  <span>Asignación de Ruta Cíclica:</span>
                  <span className="text-[10px] text-amber-400 font-mono">Control de Congestión</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setRutaModo('auto')}
                    className={`p-2 rounded-xl border text-center transition ${
                      rutaModo === 'auto'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    <span>Auto Balance</span>
                  </button>

                  {(['A', 'B', 'C', 'D', 'E'] as RutaId[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRutaModo(r)}
                      className={`p-2 rounded-xl border text-center transition ${
                        rutaModo === r
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block font-mono font-bold">Ruta {r}</span>
                      <span className="text-[9px] text-slate-500 block truncate">
                        {RUTAS_BASE[r][0]} ➔ {RUTAS_BASE[r][4]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear y Emitir Pasaporte</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Team List & Manage */}
        {activeTab === 'lista' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o ID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {filteredTeams.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No hay equipos registrados aún. Usa la pestaña "Pases QR" para que los participantes escaneen su pase o créalos en "Crear Manualmente".
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                {filteredTeams.map((eq) => (
                  <div
                    key={eq.equipo_id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{eq.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{eq.nombre}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">
                            {eq.equipo_id}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800 text-purple-300 font-bold">
                            Ruta {eq.ruta_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {eq.integrantes.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectTeam(eq)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold transition"
                        title="Ver código QR del pasaporte de este equipo"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Pasaporte</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar al equipo ${eq.nombre} (${eq.equipo_id}) del Rally?`)) {
                            eliminarEquipo(eq.equipo_id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 hover:text-rose-400 text-slate-500 border border-slate-800 transition"
                        title="Eliminar equipo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            Equipos autorizados para el Rally de Datos 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
          >
            Cerrar
          </button>
        </div>

        {/* Sub-Modal: Full Screen QR Pass for Participant Scanning */}
        {inspectPass && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center relative shadow-2xl">
              <button
                onClick={() => setInspectPass(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase mb-2">
                Pase Oficial de Registro
              </div>

              <h3 className="text-xl font-black text-white">
                Código para {inspectPass.equipo_id_asignado}
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-3">
                Asignado a <strong className="text-cyan-400 font-mono">Ruta {inspectPass.ruta_id}</strong> ({RUTAS_BASE[inspectPass.ruta_id].join(' ➔ ')})
              </p>

              {/* Scannable QR */}
              <div className="bg-white p-4 rounded-2xl mx-auto my-3 border-4 border-amber-400/40 inline-block shadow-inner">
                {passQrUrl ? (
                  <img
                    src={passQrUrl}
                    alt={`Pase QR ${inspectPass.equipo_id_asignado}`}
                    className="w-56 h-56 aspect-square object-contain mx-auto select-none"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400 font-mono">
                    Generando QR...
                  </div>
                )}
                <div className="text-slate-950 font-mono font-extrabold text-sm mt-1">
                  {inspectPass.token}
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-xs mx-auto mt-2">
                Pide al líder del equipo que abra la aplicación en modo <strong>"Participante"</strong> y apunte su cámara a este código para activar su equipo.
              </p>

              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Pase
                </button>
                <button
                  onClick={() => setInspectPass(null)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Modal: Team QR Pass inspection */}
        {inspectTeam && (
          <TeamQrModal
            equipo={inspectTeam}
            isOpen={true}
            onClose={() => setInspectTeam(null)}
          />
        )}
      </div>
    </div>
  );
};
