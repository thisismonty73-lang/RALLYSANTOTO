import React, { useState } from 'react';
import { useRally } from '../../context/RallyContext';
import { AVATARES_DISPONIBLES } from '../../data/mockData';
import { UserPlus, Sparkles, QrCode, Check, X, Shield, Users } from 'lucide-react';

interface RegisterTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess?: (equipoId: string) => void;
}

export const RegisterTeamModal: React.FC<RegisterTeamModalProps> = ({
  isOpen,
  onClose,
  onRegisteredSuccess
}) => {
  const { registrarEquipo } = useRally();

  const [nombre, setNombre] = useState('');
  const [integrante1, setIntegrante1] = useState('');
  const [integrante2, setIntegrante2] = useState('');
  const [integrante3, setIntegrante3] = useState('');
  const [password, setPassword] = useState('rally2026');
  const [avatar, setAvatar] = useState('⚡');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa el nombre del equipo.');
      return;
    }

    const integrantes = [integrante1, integrante2, integrante3].filter(i => i.trim().length > 0);
    if (integrantes.length === 0) {
      setErrorMsg('Por favor ingresa al menos un integrante del equipo.');
      return;
    }

    const res = registrarEquipo(nombre.trim(), integrantes, avatar, password);
    if (res.equipo) {
      onRegisteredSuccess?.(res.equipo.equipo_id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              Registro Oficial de Equipo
            </h3>
            <p className="text-xs text-slate-400">
              Rally de Datos 2026 • Asignación de Ruta Equilibrada
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Avatar Selector */}
          <div>
            <label className="text-slate-300 font-bold block mb-1.5">
              Selecciona tu Avatar de Equipo:
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATARES_DISPONIBLES.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition border ${
                    avatar === av
                      ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/30 scale-110'
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                placeholder="Participante 1 (Líder)"
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

          {/* Password */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">
              Contraseña de Acceso al Pasaporte:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Balance info card */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              El sistema generará tu <strong>Código QR Único</strong> y te asignará aleatoriamente una de las <strong>5 Rutas Cíclicas (A, B, C, D o E)</strong> para evitar aglomeraciones en las estaciones.
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Crear Pasaporte Digital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
