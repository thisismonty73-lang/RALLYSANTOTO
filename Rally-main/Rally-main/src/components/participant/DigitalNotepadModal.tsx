import React, { useState, useEffect } from 'react';
import { useRally } from '../../context/RallyContext';
import { Equipo } from '../../types/rally';
import { 
  BookOpen, 
  Calculator, 
  Binary, 
  Grid3X3, 
  Check, 
  Save, 
  X, 
  Lightbulb, 
  Cpu,
  RotateCcw
} from 'lucide-react';

interface DigitalNotepadModalProps {
  equipo: Equipo;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalNotepadModal: React.FC<DigitalNotepadModalProps> = ({ equipo, isOpen, onClose }) => {
  const { actualizarBlocNotas } = useRally();

  const [lecturaE3, setLecturaE3] = useState(equipo.bloc_notas?.lecturaE3 || '');
  const [calculoModulo, setCalculoModulo] = useState(equipo.bloc_notas?.calculoModulo || '');
  const [calculoDivision, setCalculoDivision] = useState(equipo.bloc_notas?.calculoDivision || '');
  const [notasLibres, setNotasLibres] = useState(equipo.bloc_notas?.notasLibres || '');
  const [guardadoMsg, setGuardadoMsg] = useState(false);

  // Quick binary tool
  const [binInput, setBinInput] = useState('23');

  // Sync state if team changes
  useEffect(() => {
    if (equipo) {
      setLecturaE3(equipo.bloc_notas?.lecturaE3 || '');
      setCalculoModulo(equipo.bloc_notas?.calculoModulo || '');
      setCalculoDivision(equipo.bloc_notas?.calculoDivision || '');
      setNotasLibres(equipo.bloc_notas?.notasLibres || '');
    }
  }, [equipo]);

  if (!isOpen) return null;

  // Auto-calculate modulo and division whenever reading changes
  const handleLecturaChange = (val: string) => {
    setLecturaE3(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const mod = (num % 5).toString();
      const div = Math.floor(num / 5).toString();
      setCalculoModulo(mod);
      setCalculoDivision(div);
    } else {
      setCalculoModulo('');
      setCalculoDivision('');
    }
  };

  const handleSave = () => {
    actualizarBlocNotas(equipo.equipo_id, {
      lecturaE3,
      calculoModulo,
      calculoDivision,
      notasLibres
    });
    setGuardadoMsg(true);
    setTimeout(() => setGuardadoMsg(false), 2000);
  };

  const filaCalculada = parseInt(calculoDivision, 10);
  const colCalculada = parseInt(calculoModulo, 10);

  // Conversion values for binary tool
  const parsedNum = parseInt(binInput, 10);
  const binaryStr = !isNaN(parsedNum) ? parsedNum.toString(2).padStart(8, '0') : '--------';
  const hexStr = !isNaN(parsedNum) ? '0x' + parsedNum.toString(16).toUpperCase() : '--';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                Bloc de Notas Digital & Telemetría
              </h3>
              <p className="text-xs text-slate-400">
                Calculadora de matrices, conversión de base y notas para {equipo.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-4 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Section 1: Estación 3 & Estación 4 Matrix Math */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-cyan-400" />
                  Conexión Estación 3 ➔ Estación 4
                </h4>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Sensor ➔ Matriz 5x5
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Ingresa la lectura capturada en el sensor de la Estación 3 (ej. 23 cm) para calcular las coordenadas de la matriz en la Estación 4:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Lectura Estación 3 (cm):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={lecturaE3}
                    onChange={(e) => handleLecturaChange(e.target.value)}
                    placeholder="Ej. 23"
                    className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-2 text-cyan-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">cm</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Fila = Floor(Dato / 5):
                </label>
                <input
                  type="text"
                  readOnly
                  value={calculoDivision !== '' ? calculoDivision : '--'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Columna = Dato Mod 5:
                </label>
                <input
                  type="text"
                  readOnly
                  value={calculoModulo !== '' ? calculoModulo : '--'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm"
                />
              </div>
            </div>

            {/* Visual 5x5 Matrix Preview */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5 text-emerald-400" />
                  Mapeo Visual en Matriz de 5x5:
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {calculoDivision !== '' && calculoModulo !== ''
                    ? `Coordenada activa: [Fila: ${filaCalculada}, Col: ${colCalculada}]`
                    : 'Ingresa un valor para iluminar la celda'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto py-2">
                {Array.from({ length: 5 }).map((_, row) =>
                  Array.from({ length: 5 }).map((__, col) => {
                    const isTarget = row === filaCalculada && col === colCalculada;
                    const cellIndex = row * 5 + col;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-mono transition-all border ${
                          isTarget
                            ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-300 shadow-lg shadow-emerald-500/50 scale-105'
                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                        }`}
                        title={`[${row}, ${col}] - Valor ${cellIndex}`}
                      >
                        <span>{cellIndex}</span>
                        <span className="text-[8px] opacity-75">{row},{col}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Conversor Binario / Hexadecimal Rápido */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Binary className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">
                Conversor Rápido de Datos (Estaciones 1 & 2)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Decimal:
                </label>
                <input
                  type="number"
                  value={binInput}
                  onChange={(e) => setBinInput(e.target.value)}
                  className="w-full bg-slate-900 border border-purple-500/40 rounded-lg px-3 py-2 text-purple-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Binario (8 bits):
                </label>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-cyan-400 font-mono font-bold text-xs truncate">
                  {binaryStr}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Hexadecimal:
                </label>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold text-xs">
                  {hexStr}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cuaderno Libre */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1 flex items-center justify-between">
              <span>Notas Libres del Equipo:</span>
              <span className="text-[11px] text-slate-500 font-normal">Se guarda automáticamente</span>
            </label>
            <textarea
              rows={4}
              value={notasLibres}
              onChange={(e) => setNotasLibres(e.target.value)}
              placeholder="Anota aquí lecturas intermedias, cálculos de paridad, tablas de verdad de la Estación 1 o pistas deducidas..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Footer with Save */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            {guardadoMsg ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> ¡Notas guardadas y sincronizadas!
              </span>
            ) : (
              <span className="text-slate-500">Datos sincronizados con tu equipo</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
