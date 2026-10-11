import React from 'react';
import { Skull, AlertTriangle } from 'lucide-react';

interface GrappleOverlayProps {
  progress: number;
  mashKey: 'F' | 'AD';
}

export const GrappleOverlay: React.FC<GrappleOverlayProps> = ({
  progress,
  mashKey,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-40 flex items-center justify-center overflow-hidden">
      {/* Heavy blood vignette & heartbeat border */}
      <div className="absolute inset-0 bg-red-950/30 mix-blend-multiply border-[16px] border-red-700/60 animate-pulse pointer-events-none" />

      {/* Central QTE Struggle Card */}
      <div className="relative z-50 bg-black/90 border-2 border-red-600/90 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.7)] flex flex-col items-center max-w-md text-center backdrop-blur-xl animate-bounce">
        <div className="flex items-center gap-2 text-rose-500 font-mono text-sm uppercase tracking-widest font-bold mb-2">
          <AlertTriangle className="w-5 h-5 animate-spin" />
          <span>¡FORCEJEO ACTIVO!</span>
          <Skull className="w-5 h-5" />
        </div>

        <h2 className="text-xl font-extrabold text-stone-100 tracking-wide mb-4">
          {mashKey === 'F' ? '¡PULSA [F] REPETIDAMENTE!' : '¡ALTERNA [A] Y [D] RÁPIDAMENTE!'}
        </h2>

        {/* Big pulsing Key Icon */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 border-4 border-stone-200 flex items-center justify-center text-4xl font-mono font-black text-white shadow-2xl scale-110 mb-6">
          {mashKey === 'F' ? 'F' : 'A ⇄ D'}
        </div>

        {/* Escape Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-mono text-stone-300 mb-1.5 font-bold">
            <span>LIBERACIÓN:</span>
            <span className="text-rose-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-4 bg-stone-900 rounded-full border border-stone-700 overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-emerald-500 rounded-full transition-all duration-75"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>

        <p className="text-xs font-mono text-stone-400 mt-4">
          ¡Libérate antes de que el infectado te muerda o te derribe!
        </p>
      </div>
    </div>
  );
};
