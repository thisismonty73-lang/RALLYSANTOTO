import React, { useState } from 'react';
import { useRally } from '../../context/RallyContext';
import { ESTACIONES, RUTAS_BASE, PASSWORD_LOGISTICA_FIJA } from '../../data/mockData';
import { EstacionId, RutaId, Equipo } from '../../types/rally';
import { MonitorQrPassesModal } from './MonitorQrPassesModal';
import { TeamManagementModal } from './TeamManagementModal';
import { MysqlWorkbenchModal } from './MysqlWorkbenchModal';
import { LogisticsAuthModal } from '../auth/LogisticsAuthModal';
import { 
  Trophy, 
  Users, 
  Clock, 
  MapPin, 
  Download, 
  RotateCcw, 
  Send, 
  Radio, 
  Flame, 
  Award, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  AlertTriangle, 
  Play, 
  Pause, 
  Smartphone, 
  UserPlus, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  KeyRound,
  Database,
  Cloud,
  Share2
} from 'lucide-react';
import { ShareDevicesModal } from '../common/ShareDevicesModal';

export const LogisticsDashboard: React.FC = () => {
  const { 
    equipos, 
    registros, 
    broadcasts, 
    enviarBroadcast, 
    reiniciarDatosRally, 
    poblarSimulacionCompleta,
    globalConfig,
    isLogisticaAuthed,
    logoutLogistica
  } = useRally();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRutaFilter, setSelectedRutaFilter] = useState<string>('todas');
  
  // Modals
  const [showMonitorPasses, setShowMonitorPasses] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMysqlModal, setShowMysqlModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Broadcast modal/input state
  const [broadcastTitle, setBroadcastTitle] = useState('¡Aviso Oficial de Logística!');
  const [broadcastText, setBroadcastText] = useState('Faltan 60 segundos para el cambio de turno en estaciones.');
  const [broadcastType, setBroadcastType] = useState<'alerta' | 'info' | 'tiempo_limite'>('tiempo_limite');
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);

  // If not logged in as Logistics, show lock screen
  if (!isLogisticaAuthed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-950">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase mb-2">
            Área Restringida del Comité
          </span>

          <h2 className="text-2xl font-black text-white">
            Consola Central de Logística
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed">
            Esta sección permite la gestión de los 25 equipos, generación de pases QR para monitores y telemetría global.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-6 flex items-center justify-center gap-2 mx-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ingresar Contraseña de Logística</span>
          </button>

          <LogisticsAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
          />
        </div>
      </div>
    );
  }

  // Stats calculation
  const totalEquipos = equipos.length;
  const finalizados = equipos.filter(e => e.estacion_actual_index >= 5).length;
  const enEstacion = equipos.filter(e => e.en_estacion_actual).length;
  const enTransito = equipos.filter(e => !e.en_estacion_actual && e.estacion_actual_index < 5).length;
  const promedioPuntaje = Math.round(equipos.reduce((acc, e) => acc + e.puntaje_total, 0) / (totalEquipos || 1));

  // Leaderboard sorting: Points DESC, then Time ASC
  const leaderboard = [...equipos].sort((a, b) => {
    if (b.puntaje_total !== a.puntaje_total) {
      return b.puntaje_total - a.puntaje_total;
    }
    return a.tiempo_acumulado_segundos - b.tiempo_acumulado_segundos;
  });

  const filteredLeaderboard = leaderboard.filter(eq => {
    const matchesSearch = eq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          eq.equipo_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRuta = selectedRutaFilter === 'todas' || eq.ruta_id === selectedRutaFilter;
    return matchesSearch && matchesRuta;
  });

  const formatTiempo = (segs: number) => {
    const mins = Math.floor(segs / 60);
    const s = segs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  // Heatmap grouping: which teams are at which station or finished
  const heatmap: Record<string, Equipo[]> = {
    E1: [],
    E2: [],
    E3: [],
    E4: [],
    E5: [],
    transito: [],
    finalizado: []
  };

  equipos.forEach(eq => {
    if (eq.estacion_actual_index >= 5) {
      heatmap.finalizado.push(eq);
    } else if (eq.en_estacion_actual) {
      const currentStation = eq.ruta_asignada[eq.estacion_actual_index];
      heatmap[currentStation]?.push(eq);
    } else {
      heatmap.transito.push(eq);
    }
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID_Equipo', 'Nombre', 'Ruta', 'Integrantes', 'Estaciones_Completadas', 'Puntaje_Total', 'Tiempo_Total_Segundos', 'Insignias'];
    const rows = leaderboard.map(eq => [
      eq.equipo_id,
      `"${eq.nombre}"`,
      eq.ruta_id,
      `"${eq.integrantes.join('; ')}"`,
      eq.estacion_actual_index,
      eq.puntaje_total,
      eq.tiempo_acumulado_segundos,
      `"${eq.insignias.join('; ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_rally_datos_2026_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ equipos, registros, fecha: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rally_datos_completo_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastText) return;
    enviarBroadcast(broadcastTitle, broadcastText, broadcastType);
    setShowBroadcastForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Header and Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Mando Central • Logística & Control
              </span>
              <span className="font-mono text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Clave: {PASSWORD_LOGISTICA_FIJA}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white">
              Dashboard de Logística — Rally de Datos 2026
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Control total del evento, creación oficial de equipos, pases QR para monitores y telemetría en tiempo real.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Monitor QR Passes Generator */}
            <button
              onClick={() => setShowMonitorPasses(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-purple-600/20 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pases QR Monitores (E1 - E5)</span>
            </button>

            {/* Team Manager */}
            <button
              onClick={() => setShowTeamManager(true)}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear / Gestionar Equipos</span>
            </button>

            {/* Push broadcast */}
            <button
              onClick={() => setShowBroadcastForm(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              Alerta Push
            </button>

            {/* Exports */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Descargar tabla en formato CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              CSV
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Exportar base de datos en JSON"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              JSON
            </button>

            {/* Share with other devices / project QR */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/90 to-indigo-950/90 hover:from-purple-900 hover:to-indigo-900 text-purple-300 px-3 py-2 rounded-xl text-xs font-bold border border-purple-500/40 shadow-sm transition cursor-pointer"
              title="Compartir enlace o proyectar código QR para otros celulares y participantes"
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Proyectar / Compartir QR</span>
            </button>

            {/* MySQL / Aiven Integration */}
            <button
              onClick={() => setShowMysqlModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-950/90 to-cyan-950/90 hover:from-blue-900 hover:to-cyan-900 text-cyan-300 px-3 py-2 rounded-xl text-xs font-bold border border-cyan-500/40 shadow-sm transition cursor-pointer"
              title="Configuración de Aiven.io, MySQL Workbench y Scripts Oficiales"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Aiven.io & MySQL</span>
            </button>

            {/* Logout */}
            <button
              onClick={logoutLogistica}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-800 transition"
              title="Cerrar sesión de logística"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Global Event Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Equipos Totales</span>
            <span className="text-2xl font-black text-white font-mono">{totalEquipos}</span>
            <span className="text-[10px] text-cyan-400 block font-mono">5 rutas cíclicas</span>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">En Tránsito</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">{enTransito}</span>
            <span className="text-[10px] text-slate-500 block">entre estaciones</span>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">En Evaluación</span>
            <span className="text-2xl font-black text-purple-400 font-mono">{enEstacion}</span>
            <span className="text-[10px] text-slate-500 block">con monitor activo</span>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Rally Concluido</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{finalizados}</span>
            <span className="text-[10px] text-slate-500 block">5/5 completadas</span>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Puntaje Medio</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{promedioPuntaje}</span>
            <span className="text-[10px] text-slate-500 block">pts promedio</span>
          </div>
        </div>
      </div>

      {/* Broadcast Modal / Emitter Form */}
      {showBroadcastForm && (
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              Emitir Alerta Push a Todos los Pasaportes Digitales
            </h3>
            <button
              onClick={() => setShowBroadcastForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Título del Comunicado:</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Tipo de Notificación:</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="tiempo_limite">⏰ Tiempo Límite (Faltan 60s)</option>
                  <option value="alerta">⚠️ Alerta Urgente</option>
                  <option value="info">ℹ️ Comunicado General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Mensaje para los participantes:</label>
              <textarea
                rows={2}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastForm(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                Transmitir Inmediatamente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Heatmap / Matriz de Calor de Ubicación */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">
              Matriz de Calor & Flujo en Vivo ({totalEquipos} Equipos)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Control de congestión: Diseñado para distribuir exactamente 5 equipos por estación inicial.
          </p>
        </div>

        {/* 7 Columns: E1, E2, E3, E4, E5, En Tránsito, Finalizados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(['E1', 'E2', 'E3', 'E4', 'E5'] as EstacionId[]).map((eId) => {
            const list = heatmap[eId] || [];
            const isFull = list.length >= 5;

            return (
              <div
                key={eId}
                className="bg-slate-950/80 rounded-2xl p-3 border border-slate-855 flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {eId}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isFull ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {list.length} equipos
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate mb-2">
                    {ESTACIONES[eId].nombre}
                  </div>
                </div>

                <div className="space-y-1 my-2">
                  {list.length === 0 ? (
                    <div className="text-[10px] text-slate-600 font-mono py-2 text-center">
                      Vacía
                    </div>
                  ) : (
                    list.map(eq => (
                      <div
                        key={eq.equipo_id}
                        className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center justify-between text-slate-200"
                      >
                        <span className="truncate max-w-[90px]">{eq.avatar} {eq.nombre}</span>
                        <span className="text-amber-400 font-bold">{eq.puntaje_total}p</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-[9px] text-slate-500 font-mono text-center pt-1 border-t border-slate-900">
                  Capacidad: 5 eq.
                </div>
              </div>
            );
          })}

          {/* En Tránsito Column */}
          <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-855 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Tránsito
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  {heatmap.transito.length} eq.
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                En ruta / descifrando
              </div>
            </div>

            <div className="space-y-1 my-2 max-h-36 overflow-y-auto">
              {heatmap.transito.slice(0, 4).map(eq => (
                <div
                  key={eq.equipo_id}
                  className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center justify-between text-slate-300"
                >
                  <span className="truncate max-w-[90px]">{eq.avatar} {eq.nombre}</span>
                  <span className="text-slate-400">Paso {eq.estacion_actual_index + 1}</span>
                </div>
              ))}
              {heatmap.transito.length > 4 && (
                <div className="text-[9px] text-slate-500 text-center font-mono">
                  +{heatmap.transito.length - 4} más...
                </div>
              )}
            </div>

            <div className="text-[9px] text-cyan-500/80 font-mono text-center pt-1 border-t border-slate-900">
              Desplazándose
            </div>
          </div>

          {/* Finalizados Column */}
          <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-855 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-emerald-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Meta 🏁
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {heatmap.finalizado.length} eq.
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                Ruta 100% completada
              </div>
            </div>

            <div className="space-y-1 my-2 max-h-36 overflow-y-auto">
              {heatmap.finalizado.slice(0, 4).map(eq => (
                <div
                  key={eq.equipo_id}
                  className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded border border-emerald-500/30 flex items-center justify-between text-emerald-300"
                >
                  <span className="truncate max-w-[90px]">🏆 {eq.nombre}</span>
                  <span className="font-bold">{eq.puntaje_total}p</span>
                </div>
              ))}
              {heatmap.finalizado.length > 4 && (
                <div className="text-[9px] text-slate-500 text-center font-mono">
                  +{heatmap.finalizado.length - 4} más...
                </div>
              )}
            </div>

            <div className="text-[9px] text-emerald-500/80 font-mono text-center pt-1 border-t border-slate-900">
              Certificados
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Official Leaderboard Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">
              Tabla de Posiciones Oficial (Leaderboard)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar equipo o ID..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={selectedRutaFilter}
              onChange={(e) => setSelectedRutaFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="todas">Todas las Rutas (A - E)</option>
              <option value="A">Ruta A</option>
              <option value="B">Ruta B</option>
              <option value="C">Ruta C</option>
              <option value="D">Ruta D</option>
              <option value="E">Ruta E</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Pos</th>
                <th className="py-3 px-3">Equipo</th>
                <th className="py-3 px-3">Ruta</th>
                <th className="py-3 px-3">Estaciones</th>
                <th className="py-3 px-3 text-right">Tiempo Total</th>
                <th className="py-3 px-3 text-right">Puntuación</th>
                <th className="py-3 px-3 text-center">Insignias</th>
                <th className="py-3 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredLeaderboard.map((eq, index) => {
                const isTop3 = index < 3;
                const posEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
                const isFinished = eq.estacion_actual_index >= 5;

                return (
                  <tr
                    key={eq.equipo_id}
                    className={`hover:bg-slate-850/50 transition ${
                      isTop3 ? 'bg-amber-500/[0.02]' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-sm">
                      <span className={isTop3 ? 'text-base' : 'text-slate-400'}>{posEmoji}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl shrink-0">{eq.avatar}</span>
                        <div>
                          <div className="font-bold text-white leading-snug">{eq.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {eq.equipo_id} • {eq.integrantes.join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold text-cyan-400">
                        Ruta {eq.ruta_id}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">
                          {Math.min(5, eq.estacion_actual_index)}/5
                        </span>
                        <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 hidden sm:block">
                          <div
                            className="bg-cyan-500 h-full"
                            style={{ width: `${(Math.min(5, eq.estacion_actual_index) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-right text-slate-300">
                      {formatTiempo(eq.tiempo_acumulado_segundos)}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-right text-amber-400 text-sm">
                      {eq.puntaje_total} <span className="text-[10px] text-slate-500 font-normal">pts</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 font-mono text-xs">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{eq.insignias.length}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Concluido
                        </span>
                      ) : eq.en_estacion_actual ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                          En Reto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                          En Ruta
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MonitorQrPassesModal
        isOpen={showMonitorPasses}
        onClose={() => setShowMonitorPasses(false)}
      />

      <TeamManagementModal
        isOpen={showTeamManager}
        onClose={() => setShowTeamManager(false)}
      />

      <MysqlWorkbenchModal
        isOpen={showMysqlModal}
        onClose={() => setShowMysqlModal(false)}
      />

      <ShareDevicesModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};
