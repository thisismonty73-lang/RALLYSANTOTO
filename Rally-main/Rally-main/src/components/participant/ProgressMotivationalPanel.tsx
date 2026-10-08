import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { Equipo, RegistroEstacion } from '../../types/rally';
import { ESTACIONES } from '../../data/mockData';
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ProgressMotivationalPanelProps {
  equipo: Equipo;
  registros: RegistroEstacion[];
}

export const ProgressMotivationalPanel: React.FC<ProgressMotivationalPanelProps> = ({ 
  equipo, 
  registros 
}) => {
  const totalEstaciones = 5;
  const completadas = Math.min(totalEstaciones, equipo.estacion_actual_index);
  const porcentaje = Math.round((completadas / totalEstaciones) * 100);
  const pendientes = totalEstaciones - completadas;
  const enCurso = completadas < totalEstaciones ? 1 : 0;
  const porRecorrer = Math.max(0, pendientes - enCurso);

  // Motivational message and theme based on current progress
  const getMotivationalContent = () => {
    switch (completadas) {
      case 0:
        return {
          fase: 'Inicio de Misión',
          icono: '🚀',
          titulo: '¡El Rally de Datos comienza aquí!',
          mensaje: 'Mantengan la calma, comuníquense con claridad y recuerden leer las pistas con atención. Cada segundo cuenta.',
          sublema: 'Primer objetivo: Conquistar la primera estación.',
          colorBorde: 'border-cyan-500/50',
          colorBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          colorGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent'
        };
      case 1:
        return {
          fase: 'Ruptura de Inercia',
          icono: '⚡',
          titulo: '¡Primer sello asegurado!',
          mensaje: '¡Excelente arranque! Los engranajes del equipo ya están sincronizados. Mantengan ese ritmo de datos constante.',
          sublema: '20% del circuito dominado. ¡A por la siguiente!',
          colorBorde: 'border-blue-500/50',
          colorBadge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          colorGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent'
        };
      case 2:
        return {
          fase: 'Consolidación',
          icono: '🔥',
          titulo: '¡Casi a mitad de camino!',
          mensaje: 'Están demostrando temple y velocidad técnica. La sinergia del equipo se nota en cada decisión.',
          sublema: '40% completado. ¡Están en zona de liderazgo!',
          colorBorde: 'border-amber-500/50',
          colorBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          colorGradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
        };
      case 3:
        return {
          fase: 'Punto de Inflexión',
          icono: '💪',
          titulo: '¡Más de la mitad superada!',
          mensaje: 'Han superado lo más exigente del circuito. La meta ya está a la vista, no bajen la guardia en los cálculos.',
          sublema: '60% completado. ¡El podio los espera!',
          colorBorde: 'border-purple-500/50',
          colorBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          colorGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent'
        };
      case 4:
        return {
          fase: 'Recta Final',
          icono: '🎯',
          titulo: '¡A un solo reto de la gloria!',
          mensaje: 'Solo queda una estación por sellar. Dejen todo en este último reto técnico. ¡Concentración total!',
          sublema: '80% completado. ¡Último empuje hacia la victoria!',
          colorBorde: 'border-emerald-500/50',
          colorBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          colorGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
        };
      case 5:
      default:
        return {
          fase: 'Circuito Completo',
          icono: '🏆',
          titulo: '¡Misión Cumplida! Pasaporte Dorado',
          mensaje: '¡Lo lograron! Las 5 estaciones han sido selladas exitosamente. El equipo ha dejado su huella en el Rally de Datos 2026.',
          sublema: '100% completado. ¡Listos para la ceremonia de premiación!',
          colorBorde: 'border-yellow-400/60',
          colorBadge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
          colorGradient: 'from-yellow-500/25 via-amber-500/15 to-transparent'
        };
    }
  };

  const motivacion = getMotivationalContent();

  // Data for Recharts Donut PieChart
  const pieData = [
    { name: 'Completadas', value: completadas, color: '#06b6d4' }, // Cyan
    ...(enCurso > 0 ? [{ name: 'En Curso', value: enCurso, color: '#f59e0b' }] : []), // Amber
    ...(porRecorrer > 0 ? [{ name: 'Pendientes', value: porRecorrer, color: '#1e293b' }] : []) // Dark Slate
  ];

  // Data for Station-by-station score BarChart
  const barData = equipo.ruta_asignada.map((estId, index) => {
    const reg = registros.find(r => r.equipo_id === equipo.equipo_id && r.estacion_id === estId && (r.estado === 'aprobado' || r.estado === 'fallido_continuado'));
    const isCompleted = index < completadas;
    const isCurrent = index === completadas;
    
    let puntos = 0;
    let statusText = 'Bloqueada';
    let barColor = '#334155'; // slate-700

    if (reg) {
      puntos = reg.puntaje_obtenido;
      statusText = `${puntos} pts (${reg.intentos_usados}° int)`;
      barColor = puntos === 100 ? '#10b981' : puntos === 70 ? '#06b6d4' : puntos === 40 ? '#a855f7' : '#f43f5e';
    } else if (isCurrent) {
      puntos = 15; // indicator height for current
      statusText = 'En curso';
      barColor = '#f59e0b';
    }

    return {
      nombre: `E${ESTACIONES[estId]?.numero || index + 1}`,
      estacionId: estId,
      nombreLargo: ESTACIONES[estId]?.nombre || estId,
      puntos: isCompleted ? puntos : (isCurrent ? 20 : 0),
      puntosReales: isCompleted ? puntos : 0,
      color: barColor,
      estado: statusText,
      esActual: isCurrent,
      esCompletada: isCompleted
    };
  });

  // Calculate efficiency
  const estacionesEvaluadas = registros.filter(r => r.equipo_id === equipo.equipo_id && (r.estado === 'aprobado' || r.estado === 'fallido_continuado'));
  const promedioPuntos = estacionesEvaluadas.length > 0
    ? Math.round(equipo.puntaje_total / estacionesEvaluadas.length)
    : 0;

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 ${motivacion.colorBorde} rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden animate-fade-in`}>
      
      {/* Background radial ambient glow */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${motivacion.colorGradient} rounded-full blur-3xl pointer-events-none`} />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Panel de Progreso & Rendimiento
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${motivacion.colorBadge}`}>
                {motivacion.fase}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoreo en tiempo real del avance oficial de <strong className="text-slate-200">{equipo.nombre}</strong>
            </p>
          </div>
        </div>

        {/* Efficiency pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Promedio:</span>
            <span className="font-bold text-amber-400">{promedioPuntos} pts / est</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Estado:</span>
            <span className="font-bold text-cyan-300">{completadas}/{totalEstaciones} sellos</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Chart on Left + Motivational Catalyst on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column (5 cols): Recharts Radial Donut + Stepper */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              Estaciones Completadas vs Totales
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {porcentaje}%
            </span>
          </div>

          {/* Recharts Donut PieChart */}
          <div className="relative w-full h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl text-xs font-mono">
                          <span className="text-slate-300 font-bold">{data.name}: </span>
                          <span className="text-cyan-400 font-black">{data.value} estaciones</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Badge inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none">
                {completadas}<span className="text-lg text-slate-500">/{totalEstaciones}</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-1">
                {porcentaje === 100 ? 'Completado' : 'Selladas'}
              </span>
            </div>
          </div>

          {/* Micro Legend & Station Checkpoint Steps */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-5 gap-1.5">
              {equipo.ruta_asignada.map((estId, idx) => {
                const done = idx < completadas;
                const current = idx === completadas;
                return (
                  <div
                    key={estId}
                    className={`rounded-xl py-2 px-1 text-center transition border ${
                      done
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                        : current
                        ? 'bg-amber-950/50 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/20 animate-pulse'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold">
                      E{ESTACIONES[estId]?.numero}
                    </div>
                    <div className="text-[9px] truncate mt-0.5">
                      {done ? '✓ Sellado' : current ? '● En curso' : '○ Espera'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Motivational Message Card + Score Bar Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          
          {/* Dynamic Motivational Banner */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="text-3xl sm:text-4xl select-none shrink-0 filter drop-shadow">
                {motivacion.icono}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-base sm:text-lg font-black text-white">
                    {motivacion.titulo}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/20">
                    {motivacion.sublema}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {motivacion.mensaje}
                </p>
              </div>
            </div>

            {/* Quick motivational advice for the specific upcoming station */}
            {completadas < totalEstaciones && (
              <div className="mt-3.5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Siguiente reto:</span>
                  <strong className="text-cyan-300 font-semibold">
                    {ESTACIONES[equipo.ruta_asignada[completadas]]?.nombre}
                  </strong>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Base: 100 pts (1er intento)
                </span>
              </div>
            )}
          </div>

          {/* Recharts BarChart: Points per Station Progression */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Desempeño de Puntos por Estación
              </span>
              <span className="text-xs font-mono text-slate-400">
                Puntaje actual: <strong className="text-amber-400">{equipo.puntaje_total}</strong> / 500 max
              </span>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="nombre" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    ticks={[0, 50, 100]}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl shadow-2xl text-xs font-mono space-y-1">
                            <div className="font-bold text-white">{d.nombre} — {d.nombreLargo}</div>
                            <div className="text-slate-300">
                              Estado: <span className="text-cyan-400 font-bold">{d.estado}</span>
                            </div>
                            {d.esCompletada && (
                              <div className="text-amber-400 font-black">Puntaje: {d.puntosReales} pts</div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="puntos" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
