import React from 'react';
import { GameEngineState } from '../game/GameEngine';
import { 
  ShieldAlert, 
  Flame, 
  Volume2, 
  Flashlight, 
  Sparkles, 
  HandMetal, 
  Crosshair, 
  Backpack, 
  BookOpen, 
  Layers 
} from 'lucide-react';

interface HUDProps {
  state: GameEngineState;
  onOpenBackpack: () => void;
  onInspectKnife: () => void;
  onOpenMenu: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  onOpenBackpack,
  onInspectKnife,
  onOpenMenu,
}) => {
  const { injuries } = state;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-6 overflow-hidden">
      {/* Top Bar: Objective & Quick Toggles */}
      <div className="flex items-start justify-between">
        {/* Objective banner */}
        <div className="bg-black/75 backdrop-blur-md border-l-4 border-amber-600 px-5 py-3 rounded-r-lg max-w-xl text-stone-200 shadow-2xl">
          <div className="text-[10px] tracking-widest uppercase font-semibold text-amber-500 font-mono">
            OBJETIVO ACTIVO — PARADERO DE ELLIE
          </div>
          <div className="text-sm font-medium tracking-wide mt-0.5 text-stone-100">
            {state.currentObjective}
          </div>
          <div className="text-xs text-stone-400 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              JJ en camino a St. Mary's
            </span>
            <span>•</span>
            <span className="text-amber-400/90 font-mono text-[11px]">Cuchillo de Dina equipado</span>
          </div>
        </div>

        {/* Top-Right Quick Action Hints */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onInspectKnife}
            className="bg-black/60 hover:bg-black/85 text-stone-300 hover:text-white px-3.5 py-2 rounded border border-stone-800 backdrop-blur-md text-xs font-mono flex items-center gap-2 transition"
            title="Inspeccionar cuchillo y recuerdos de Dina [X]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>[X] Inspeccionar Cuchillo</span>
          </button>

          <button
            onClick={onOpenBackpack}
            className="bg-black/60 hover:bg-black/85 text-stone-300 hover:text-white px-3.5 py-2 rounded border border-stone-800 backdrop-blur-md text-xs font-mono flex items-center gap-2 transition"
            title="Mochila de Supervivencia y Fabricación [Tab]"
          >
            <Backpack className="w-3.5 h-3.5 text-emerald-400" />
            <span>[Tab] Mochila</span>
          </button>

          <button
            onClick={onOpenMenu}
            className="bg-black/60 hover:bg-black/85 text-stone-300 hover:text-white px-3.5 py-2 rounded border border-stone-800 backdrop-blur-md text-xs font-mono flex items-center gap-2 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>[ESC] Opciones</span>
          </button>
        </div>
      </div>

      {/* Surface Leaning Indicator & Interaction Prompt (Center) */}
      <div className="flex flex-col items-center justify-center gap-3">
        {/* Dynamic Surface Leaning Prompt */}
        {state.isLeaning && (
          <div className="bg-stone-900/90 border border-amber-600/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono text-amber-300 flex items-center gap-2 shadow-lg animate-pulse">
            <HandMetal className="w-4 h-4 text-amber-400" />
            <span>
              Apoyado en {state.leanType === 'wall' ? 'muro' : state.leanType === 'car' ? 'vehículo' : 'cobertura'} — Estabilizando postura
            </span>
          </div>
        )}

        {/* Contextual Interaction Cue */}
        {state.interactionPrompt && (
          <div className="bg-black/85 border border-stone-700/80 backdrop-blur-lg px-6 py-3 rounded-lg text-stone-100 flex items-center gap-3 shadow-2xl animate-bounce">
            <span className="w-7 h-7 rounded bg-amber-600/90 text-black font-bold flex items-center justify-center font-mono text-sm">
              {state.interactionPrompt.key}
            </span>
            <span className="text-sm font-medium tracking-wide">
              {state.interactionPrompt.text}
            </span>
          </div>
        )}

        {/* Aiming Arc Prompt */}
        {state.isAimingBottle && (
          <div className="bg-black/80 border border-emerald-600/60 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-300 flex items-center gap-2 shadow-md">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span>Click Izquierdo: Lanzar Botella para Distraer</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Health, Limping Status, Anatomical Damage & Weapons */}
      <div className="flex items-end justify-between">
        {/* Left: Anatomical Body Damage & Health */}
        <div className="flex items-end gap-5">
          {/* Anatomical Silhouette Diagram */}
          <div className="bg-black/75 backdrop-blur-md border border-stone-800/80 p-3.5 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
              <span>Lesiones Corporales</span>
            </div>

            {/* Anatomical human figure with injury heat color */}
            <div className="relative w-16 h-28 flex flex-col items-center justify-center">
              {/* Head */}
              <div 
                className={`w-4 h-4 rounded-full border border-stone-700 mb-0.5 transition-colors ${
                  injuries.head > 50 ? 'bg-red-600' : injuries.head > 20 ? 'bg-amber-600' : 'bg-stone-700'
                }`}
                title={`Cabeza: ${Math.round(injuries.head)}%`}
              />

              {/* Torso & Arms */}
              <div className="flex items-center gap-1">
                {/* Left Arm */}
                <div 
                  className={`w-2 h-9 rounded-sm border border-stone-700 transition-colors ${
                    injuries.leftArm > 50 ? 'bg-red-600' : injuries.leftArm > 20 ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                  title={`Brazo Izq: ${Math.round(injuries.leftArm)}%`}
                />
                {/* Torso */}
                <div 
                  className={`w-6 h-9 rounded-md border border-stone-700 flex items-center justify-center transition-colors ${
                    injuries.torso > 50 ? 'bg-red-600' : injuries.torso > 20 ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                  title={`Torso: ${Math.round(injuries.torso)}%`}
                >
                  {injuries.isBleeding && (
                    <Flame className="w-3.5 h-3.5 text-red-300 animate-pulse" />
                  )}
                </div>
                {/* Right Arm */}
                <div 
                  className={`w-2 h-9 rounded-sm border border-stone-700 transition-colors ${
                    injuries.rightArm > 50 ? 'bg-red-600' : injuries.rightArm > 20 ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                  title={`Brazo Der: ${Math.round(injuries.rightArm)}%`}
                />
              </div>

              {/* Legs */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Left Leg */}
                <div 
                  className={`w-2.5 h-11 rounded-sm border border-stone-700 transition-colors ${
                    injuries.leftLeg > 50 ? 'bg-red-600' : injuries.leftLeg > 20 ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                  title={`Pierna Izq (Cojera): ${Math.round(injuries.leftLeg)}%`}
                />
                {/* Right Leg */}
                <div 
                  className={`w-2.5 h-11 rounded-sm border border-stone-700 transition-colors ${
                    injuries.rightLeg > 50 ? 'bg-red-600' : injuries.rightLeg > 20 ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                  title={`Pierna Der: ${Math.round(injuries.rightLeg)}%`}
                />
              </div>
            </div>

            {/* Injury state tags */}
            <div className="mt-2 text-[10px] font-mono text-center flex flex-col gap-0.5">
              {injuries.leftLeg > 20 && (
                <span className="text-amber-400 font-semibold">• Cojera Activa</span>
              )}
              {injuries.torso > 20 && (
                <span className="text-rose-400">• Fatiga Pulmonar</span>
              )}
              {injuries.isBleeding && (
                <span className="text-red-500 font-bold animate-pulse">• Hemorragia</span>
              )}
            </div>
          </div>

          {/* Health & Stamina Bars */}
          <div className="bg-black/75 backdrop-blur-md border border-stone-800/80 p-4 rounded-xl shadow-2xl flex flex-col gap-2.5 w-60">
            {/* Health */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1 text-stone-300">
                <span className="font-semibold text-rose-400">SALUD</span>
                <span>{Math.round(state.health)}%</span>
              </div>
              <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                <div 
                  className={`h-full transition-all duration-300 ${
                    state.health < 30 ? 'bg-red-600' : state.health < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, state.health))}%` }}
                />
              </div>
            </div>

            {/* Stamina */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1 text-stone-300">
                <span className="font-semibold text-sky-400">RESISTENCIA</span>
                <span>{Math.round(state.stamina)}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                <div 
                  className="h-full bg-sky-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, state.stamina))}%` }}
                />
              </div>
            </div>

            {/* Noise / Stealth Meter */}
            <div className="flex items-center justify-between text-xs font-mono text-stone-400 pt-1 border-t border-stone-800">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Ruido:</span>
              </span>
              <span className={state.noiseLevel > 60 ? 'text-red-400 font-bold' : state.noiseLevel > 30 ? 'text-amber-400' : 'text-emerald-400'}>
                {state.isCrouching ? 'Sigilo (15%)' : state.isSprinting ? 'Alto (85%)' : 'Normal (35%)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Equipped Weapon & Dina's Knife Slot */}
        <div className="bg-black/75 backdrop-blur-md border border-stone-800/80 p-4 rounded-xl shadow-2xl flex items-center gap-5">
          {/* Dina's Knife Card */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-1">
              CUCHILLO DE DINA
            </div>
            <div className={`p-2.5 rounded-lg border flex items-center gap-3 transition-colors ${
              state.knifeDrawn 
                ? 'bg-amber-950/40 border-amber-600/80 text-amber-200' 
                : 'bg-stone-900/60 border-stone-700 text-stone-400'
            }`}>
              <div className="w-10 h-10 flex items-center justify-center bg-black/40 rounded border border-stone-800">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left font-mono">
                <div className="text-xs font-bold text-stone-100">
                  {state.knifeDrawn ? 'Desenfundado [En Mano]' : 'Enfundado [Cinturón]'}
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                  <span>Filo: {Math.round(state.knifeDurability)}%</span>
                  <div className="w-12 h-1 bg-stone-800 rounded overflow-hidden">
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${state.knifeDurability}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-stone-400 font-mono mt-1">
              [R] Alternar • [F] Puñetazo
            </div>
          </div>

          <div className="w-[1px] h-14 bg-stone-800" />

          {/* Quick Consumables: Bottles & Medkits */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between gap-4 bg-stone-900/60 px-3 py-1.5 rounded border border-stone-800">
              <span className="text-emerald-400">Botellas:</span>
              <span className="font-bold text-stone-100">{state.bottlesCount}</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-stone-900/60 px-3 py-1.5 rounded border border-stone-800">
              <span className="text-rose-400">Botiquines:</span>
              <span className="font-bold text-stone-100">{state.medkitsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
