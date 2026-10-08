import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Equipo } from '../../types/rally';
import { X, Copy, Check, QrCode, Shield, Maximize2 } from 'lucide-react';

interface TeamQrModalProps {
  equipo: Equipo;
  isOpen: boolean;
  onClose: () => void;
}

export const TeamQrModal: React.FC<TeamQrModalProps> = ({ equipo, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && equipo) {
      QRCode.toDataURL(equipo.equipo_id, {
        width: 380,
        margin: 2,
        color: {
          dark: '#030712', // deep slate/black
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR', err));
    }
  }, [isOpen, equipo]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(equipo.equipo_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className={`w-full ${fullscreen ? 'max-w-xl' : 'max-w-md'} bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative transition-all`}>
        
        {/* Close & Fullscreen buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase mb-2">
            <QrCode className="w-3.5 h-3.5" /> Pasaporte Identificador Oficial
          </div>
          <h3 className="text-xl font-extrabold text-white flex items-center justify-center gap-2">
            <span className="text-2xl">{equipo.avatar}</span> {equipo.nombre}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Muestra este código al monitor de la estación para registrar tu llegada y salida
          </p>
        </div>

        {/* The Scannable QR Code Canvas / Image */}
        <div className="bg-white p-5 rounded-2xl shadow-inner flex flex-col items-center justify-center my-3 border-4 border-cyan-500/30">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`Código QR ${equipo.equipo_id}`} 
              className={`w-full max-w-[280px] aspect-square object-contain mx-auto select-none rounded-lg ${fullscreen ? 'max-w-[340px]' : ''}`} 
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-slate-400 font-mono text-sm">
              Generando código QR seguro...
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 bg-slate-100 text-slate-900 px-4 py-1.5 rounded-lg font-mono font-extrabold text-lg tracking-wider border border-slate-300">
            <span>{equipo.equipo_id}</span>
            <button
              onClick={handleCopy}
              className="text-slate-600 hover:text-slate-950 p-1 rounded"
              title="Copiar código"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Team details in passport format */}
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Ruta Asignada:</span>
            <span className="font-bold text-cyan-400 font-mono">
              Ruta {equipo.ruta_id} ({equipo.ruta_asignada.join(' ➔ ')})
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Integrantes:</span>
            <span className="font-medium text-slate-200 truncate max-w-[200px]">
              {equipo.integrantes.join(', ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Puntaje Acumulado:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">
              {equipo.puntaje_total} pts
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> Token criptográfico sincronizado para Rally 2026
          </p>
        </div>
      </div>
    </div>
  );
};
