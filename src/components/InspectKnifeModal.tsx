import React from 'react';
import { Sparkles, Heart, Shield, X } from 'lucide-react';
import { soundEngine } from '../game/audio/SoundSystem';

interface InspectKnifeModalProps {
  onClose: () => void;
  durability: number;
  onSharpen?: () => void;
  hasSharpenMaterials?: boolean;
}

export const InspectKnifeModal: React.FC<InspectKnifeModalProps> = ({
  onClose,
  durability,
  onSharpen,
  hasSharpenMaterials,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="relative max-w-2xl w-full bg-stone-950 border border-stone-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 text-stone-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>RECUERDO FAMILIAR — CUCHILLO DE CAZA DE DINA</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-100 mt-1">
              La Hoja de Jackson
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Artistic Visualization of the Knife */}
        <div className="relative h-48 bg-gradient-to-b from-stone-900 to-stone-950 rounded-xl border border-stone-800/80 flex items-center justify-center p-6 overflow-hidden">
          {/* Subtle light reflections */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />

          {/* Detailed Schematic / Silhouette of Dina's Knife */}
          <div className="flex items-center transform -rotate-6 scale-110">
            {/* Rosewood Handle */}
            <div className="w-24 h-7 bg-gradient-to-r from-amber-950 via-stone-800 to-amber-900 rounded-l-md border border-amber-800/60 relative flex items-center justify-around px-2 shadow-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/80 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/80 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/80 shadow-sm" />
            </div>

            {/* Brass Guard */}
            <div className="w-3 h-12 bg-gradient-to-b from-yellow-600 via-amber-400 to-yellow-700 rounded-sm shadow-md" />

            {/* Steel Blade */}
            <div className="w-44 h-8 bg-gradient-to-b from-stone-300 via-stone-400 to-stone-500 border-t border-b border-r border-stone-300 rounded-r-3xl relative shadow-2xl flex items-center">
              {/* Blood groove / fuller */}
              <div className="w-32 h-1 bg-stone-700/60 rounded-full ml-2" />
            </div>
          </div>
        </div>

        {/* Narrative Memory & Emotional lore */}
        <div className="bg-stone-900/60 border border-stone-800/60 rounded-xl p-5 flex flex-col gap-3 font-serif">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono">
            <Heart className="w-4 h-4 fill-rose-500/20" />
            <span>Memoria de la Granja en Jackson:</span>
          </div>
          <p className="text-stone-300 text-sm leading-relaxed italic">
            "Dina me lo puso en la mano aquella última noche, bajo el porche de la granja. Tenía las manos frías y los ojos húmedos. Me dijo: 'Perteneció a Talia en Nuevo México, y luego me protegió en las calles de Seattle. No dejaré que te vayas desarmado a buscar a Ellie. Prométeme que cada vez que lo uses, recordarás que tienes a alguien esperándote en casa'."
          </p>
          <div className="text-xs text-stone-400 font-mono text-right">
            — JJ, Diario de viaje hacia Seattle
          </div>
        </div>

        {/* Condition & Sharpening Options */}
        <div className="flex items-center justify-between border-t border-stone-800 pt-4">
          <div className="font-mono text-xs text-stone-300 flex items-center gap-3">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Estado del Filo: <strong className="text-amber-400">{Math.round(durability)}%</strong></span>
          </div>

          <div className="flex items-center gap-3">
            {onSharpen && (
              <button
                onClick={onSharpen}
                disabled={!hasSharpenMaterials || durability >= 95}
                className={`px-4 py-2 rounded-lg font-mono text-xs flex items-center gap-2 transition ${
                  hasSharpenMaterials && durability < 95
                    ? 'bg-amber-600 hover:bg-amber-500 text-black font-bold'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Afilar Cuchilla (1 Cuchilla + 1 Cinta)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2 rounded-lg font-mono text-xs transition"
            >
              Guardar y Continuar [ESC]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
