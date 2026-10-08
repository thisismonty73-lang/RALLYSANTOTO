import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useRally } from '../../context/RallyContext';
import { EstacionId, Equipo, RegistroEstacion } from '../../types/rally';
import { ESTACIONES, MONITORES_CREDENCIALES } from '../../data/mockData';
import { QrScannerComponent } from './QrScannerComponent';
import { MonitorDeviceAuthLock } from './MonitorDeviceAuthLock';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Award, 
  Users, 
  Search, 
  Sparkles,
  ArrowRight,
  Database,
  History,
  Check,
  LogOut,
  Shield
} from 'lucide-react';

export const MonitorView: React.FC = () => {
  const { 
    activeMonitorEstacion, 
    setActiveMonitorEstacion,
    dispositivoAutorizadoEstacion,
    desautorizarDispositivoMonitor, 
    equipos, 
    registros, 
    iniciarLlegadaEstacion, 
    validarEstacion 
  } = useRally();

  // If this device is not authorized via Logistics QR yet, show the Security Lock Screen
  if (!dispositivoAutorizadoEstacion) {
    return <MonitorDeviceAuthLock onSuccessAuth={() => {}} />;
  }

  // The station is strictly locked to the one authorized on this device
  const estacionId = dispositivoAutorizadoEstacion;
  const estacionConfig = ESTACIONES[estacionId];

  // Active validation state
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [inputManualId, setInputManualId] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [intentosActuales, setIntentosActuales] = useState<number>(1);
  const [datoCapturado, setDatoCapturado] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Selected team object
  const selectedEquipo = equipos.find(e => e.equipo_id === selectedEquipoId) || null;

  // Active in-progress record for this team at this station
  const regEnProgreso = registros.find(
    r => r.equipo_id === selectedEquipoId && r.estacion_id === estacionId && r.estado === 'en_progreso'
  );

  // Teams that have already finished this station
  const registrosCompletadosEstacion = registros.filter(
    r => r.estacion_id === estacionId && (r.estado === 'aprobado' || r.estado === 'fallido_continuado')
  );

  // Teams whose NEXT step in their route is THIS station!
  const equiposEnRutaHaciaEstaEstacion = equipos.filter(eq => {
    if (eq.estacion_actual_index >= 5) return false;
    return eq.ruta_asignada[eq.estacion_actual_index] === estacionId;
  });

  // Station Timer ticking
  useEffect(() => {
    let interval: any = null;
    if (selectedEquipo && regEnProgreso) {
      const startMs = new Date(regEnProgreso.hora_llegada).getTime();
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [selectedEquipo, regEnProgreso]);

  // Handle QR scan arrival
  const handleSelectTeamArrival = (equipoId: string) => {
    setStatusFeedback(null);
    const eq = equipos.find(e => e.equipo_id.toUpperCase() === equipoId.trim().toUpperCase());
    if (!eq) {
      setStatusFeedback({ tipo: 'error', texto: `Equipo "${equipoId}" no encontrado.` });
      return;
    }

    const res = iniciarLlegadaEstacion(eq.equipo_id, estacionId);
    setSelectedEquipoId(eq.equipo_id);
    setIntentosActuales(1);
    
    // Default placeholder for captured data
    if (estacionId === 'E3') setDatoCapturado('23');
    else if (estacionId === 'E4') setDatoCapturado('[4, 3]');
    else if (estacionId === 'E1') setDatoCapturado('Carry=1, Sum=0');
    else if (estacionId === 'E2') setDatoCapturado('ADC=1023');
    else if (estacionId === 'E5') setDatoCapturado('CRC=0x7E4F');
    else setDatoCapturado('');

    if (res.ok) {
      setStatusFeedback({ tipo: 'exito', texto: res.mensaje });
    } else {
      setStatusFeedback({ tipo: 'error', texto: res.mensaje });
    }
  };

  const handleValidarPrueba = (aprobado: boolean) => {
    if (!selectedEquipo) return;

    const monitorId = `MON-${estacionId}`;
    const res = validarEstacion(
      selectedEquipo.equipo_id,
      estacionId,
      intentosActuales,
      aprobado,
      datoCapturado.trim(),
      monitorId
    );

    if (res.ok) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
      setStatusFeedback({
        tipo: 'exito',
        texto: `${res.mensaje} ${res.nuevasInsignias.length > 0 ? '¡Insignia otorgada!' : ''}`
      });
      // Clear current selection after brief delay
      setTimeout(() => {
        setSelectedEquipoId(null);
      }, 2500);
    } else {
      setStatusFeedback({ tipo: 'error', texto: res.mensaje });
    }
  };

  const formatTiempo = (segs: number) => {
    const mins = Math.floor(segs / 60);
    const s = segs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Preview score calculation
  const getPuntosPreview = (intentos: number) => {
    if (intentos === 1) return 100;
    if (intentos === 2) return 70;
    if (intentos === 3) return 40;
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Station Monitor Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-black text-2xl text-white shadow-xl shadow-purple-950"
              style={{ backgroundColor: estacionConfig.color }}
            >
              {estacionId}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  Panel de Monitor Oficial
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Estación {estacionConfig.numero} de 5
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white">
                {estacionConfig.nombre}
              </h1>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>{estacionConfig.coordenadas.nombreLugar}</span>
              </div>
            </div>
          </div>

          {/* Authorized Device Badge & Unbind */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-2xl border border-purple-500/30">
            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 font-bold block flex items-center justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> DISPOSITIVO AUTORIZADO
              </span>
              <span className="text-xs font-mono font-bold text-white">
                Mesa Exclusiva {estacionId}
              </span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Deseas desvincular este dispositivo? Necesitarás volver a escanear el QR de Logística para ingresar.')) {
                  desautorizarDispositivoMonitor();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-800 text-slate-400 text-xs font-mono transition flex items-center gap-1.5"
              title="Cerrar sesión de este monitor en este dispositivo"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desvincular</span>
            </button>
          </div>
        </div>

        {/* Reto Description Bar */}
        <div className="mt-4 pt-3 border-t border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2">
          <div>
            <strong className="text-purple-300 font-mono">Reto Técnico:</strong> {estacionConfig.descripcionReto}
          </div>
          <div className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40">
            Dato requerido: {estacionConfig.datoCapturaNombre}
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Scanner & Queued Teams, Right is Validation Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): QR Camera & Queue */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Camera QR Scanner */}
          <QrScannerComponent onScanSuccess={(code) => handleSelectTeamArrival(code)} />

          {/* Manual Input Fallback */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 font-mono flex items-center justify-between">
              <span>Ingreso Manual de Código QR</span>
              <span className="text-[10px] text-cyan-400">EQ-01 a EQ-25</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputManualId}
                onChange={(e) => setInputManualId(e.target.value.toUpperCase())}
                placeholder="Ej. EQ-01"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputManualId.trim()) {
                    handleSelectTeamArrival(inputManualId.trim());
                    setInputManualId('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (inputManualId.trim()) {
                    handleSelectTeamArrival(inputManualId.trim());
                    setInputManualId('');
                  }
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Registrar
              </button>
            </div>
          </div>

          {/* Expected Teams for this station (Next in rotation) */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Equipos en Turno para {estacionId} ({equiposEnRutaHaciaEstaEstacion.length})
              </h3>
              <span className="text-[10px] text-slate-400">Toca para simular escaneo</span>
            </div>

            {equiposEnRutaHaciaEstaEstacion.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-mono">
                No hay equipos en cola inmediata para esta estación.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {equiposEnRutaHaciaEstaEstacion.map((eq) => (
                  <button
                    key={eq.equipo_id}
                    onClick={() => handleSelectTeamArrival(eq.equipo_id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      selectedEquipoId === eq.equipo_id
                        ? 'bg-purple-950/60 border-purple-500 text-white ring-2 ring-purple-500/30'
                        : 'bg-slate-950/70 border-slate-850 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{eq.avatar}</span>
                      <div>
                        <div className="font-bold text-white text-xs">{eq.nombre}</div>
                        <div className="text-[10px] font-mono text-cyan-400">
                          {eq.equipo_id} • Ruta {eq.ruta_id} • Paso {eq.estacion_actual_index + 1}/5
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {eq.puntaje_total} pts
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {eq.en_estacion_actual ? '⏳ En mesa' : 'Por llegar'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Active Evaluation Console */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Status Feedback Toast Banner */}
          {statusFeedback && (
            <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-lg ${
              statusFeedback.tipo === 'exito'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : statusFeedback.tipo === 'error'
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
            }`}>
              {statusFeedback.tipo === 'exito' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="font-medium leading-relaxed">{statusFeedback.texto}</span>
            </div>
          )}

          {/* Validation Work Area */}
          {selectedEquipo ? (
            <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
              
              {/* Header of Active Evaluation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl">
                    {selectedEquipo.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                        {selectedEquipo.equipo_id}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                        Ruta {selectedEquipo.ruta_id}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white">
                      {selectedEquipo.nombre}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Integrantes: {selectedEquipo.integrantes.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Station Live Stopwatch */}
                <div className="bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Tiempo en Estación</span>
                  <span className="text-xl font-mono font-black text-cyan-400 flex items-center justify-end gap-1.5">
                    <Clock className="w-4 h-4 animate-spin text-cyan-400" />
                    {formatTiempo(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Step 1: Attempts Selector & Penalties */}
              <div className="my-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Control de Intentos & Penalización:
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Puntaje a otorgar: {getPuntosPreview(intentosActuales)} pts
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((num) => {
                    const isSelected = intentosActuales === num;
                    const pts = num === 1 ? 100 : num === 2 ? 70 : 40;
                    const pct = num === 1 ? '100%' : num === 2 ? '70%' : '40%';

                    return (
                      <button
                        key={num}
                        onClick={() => setIntentosActuales(num)}
                        className={`p-3.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-purple-950/80 border-purple-400 text-white ring-2 ring-purple-500/30 shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-mono font-bold uppercase">
                          Intento {num}
                        </div>
                        <div className={`text-xl font-black font-mono my-0.5 ${isSelected ? 'text-amber-400' : 'text-slate-300'}`}>
                          {pts} pts
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {pct} del puntaje
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Data Capture (Sensor reading, ADC, Coordinate, etc.) */}
              <div className="my-5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                  <span>Registro de Dato Capturado ({estacionConfig.datoCapturaNombre}):</span>
                  <span className="text-[11px] text-cyan-400 font-mono font-normal">Requerido para el pasaporte</span>
                </label>
                <input
                  type="text"
                  value={datoCapturado}
                  onChange={(e) => setDatoCapturado(e.target.value)}
                  placeholder={estacionConfig.datoCapturaPlaceholder}
                  className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-4 py-2.5 text-cyan-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Este valor quedará certificado permanentemente en el pasaporte digital del equipo.
                </p>
              </div>

              {/* Step 3: Tactile Action Buttons */}
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option A: Success / Aprobado */}
                  <button
                    onClick={() => handleValidarPrueba(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-sm shadow-xl shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Aprobar en Intento {intentosActuales} (+{getPuntosPreview(intentosActuales)} pts)</span>
                  </button>

                  {/* Option B: Fallo y pasar a siguiente intento */}
                  <button
                    onClick={() => {
                      if (intentosActuales < 3) {
                        setIntentosActuales(intentosActuales + 1);
                        setStatusFeedback({
                          tipo: 'info',
                          texto: `Intento ${intentosActuales} marcado como fallido. Ahora evaluando Intento ${intentosActuales + 1}.`
                        });
                      } else {
                        // 3 failed attempts: validate 0 points and release team
                        handleValidarPrueba(false);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 border font-bold py-3.5 px-4 rounded-2xl text-xs transition ${
                      intentosActuales < 3
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
                        : 'bg-amber-950/50 border-amber-500 text-amber-200 hover:bg-amber-900/50 font-black'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>
                      {intentosActuales < 3
                        ? `Registrar Intento Fallido (${intentosActuales}/3)`
                        : 'Fallo tras 3 Intentos (0 pts - Validar Paso)'}
                    </span>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setSelectedEquipoId(null)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Cancelar atención de este equipo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Ningún equipo en atención actualmente
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Escanea el código QR del equipo con la cámara o selecciona uno de los equipos en turno en la columna izquierda para iniciar la evaluación.
              </p>
            </div>
          )}

          {/* Station History Table */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-400" />
                Historial de Equipos Atendidos en {estacionId} ({registrosCompletadosEstacion.length})
              </h4>
            </div>

            {registrosCompletadosEstacion.length === 0 ? (
              <div className="py-4 text-center text-slate-500 text-xs font-mono">
                Aún no hay equipos certificados en esta estación hoy.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {registrosCompletadosEstacion.map((reg) => {
                  const eq = equipos.find(e => e.equipo_id === reg.equipo_id);
                  return (
                    <div
                      key={reg.registro_id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{eq?.avatar || '🤖'}</span>
                        <div>
                          <span className="font-bold text-white">{eq?.nombre || reg.equipo_id}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Dato: {reg.dato_capturado} • {new Date(reg.hora_salida || reg.hora_llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400">
                          +{reg.puntaje_obtenido} pts
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {reg.intentos_usados} int. • {reg.tiempo_estacion_segundos}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
