import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  RotateCcw, 
  Sliders, 
  Volume2, 
  Keyboard, 
  Monitor, 
  Play,
  Check
} from 'lucide-react';
import { soundEngine } from '../game/audio/SoundSystem';

interface PauseMenuProps {
  onResume: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  currentQuality: 'low' | 'med' | 'high';
  onSetQuality: (q: 'low' | 'med' | 'high') => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onSaveGame,
  onLoadGame,
  currentQuality,
  onSetQuality,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'graphics' | 'audio'>('controls');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(60);

  const handleSave = () => {
    onSaveGame();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleMasterChange = (val: number) => {
    setMasterVolume(val);
    soundEngine.setMasterVolume(val / 100);
  };

  const handleMusicChange = (val: number) => {
    setMusicVolume(val);
    soundEngine.setMusicVolume(val / 100);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="relative max-w-3xl w-full bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-serif font-bold text-stone-100">
              Menú del Sistema y Configuración
            </h1>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center gap-2 bg-stone-900/80 p-1 rounded-lg border border-stone-800">
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                activeTab === 'controls' ? 'bg-amber-600 text-black font-bold' : 'text-stone-400'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Controles</span>
            </button>
            <button
              onClick={() => setActiveTab('graphics')}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                activeTab === 'graphics' ? 'bg-amber-600 text-black font-bold' : 'text-stone-400'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Gráficos</span>
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                activeTab === 'audio' ? 'bg-amber-600 text-black font-bold' : 'text-stone-400'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Sonido</span>
            </button>
          </div>

          <button
            onClick={onResume}
            className="text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-[300px] overflow-y-auto">
          {activeTab === 'controls' && (
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Movimiento</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">W, A, S, D</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Correr</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">Shift</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Modo Sigilo / Agacharse</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">C</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Golpe Cuerpo a Cuerpo</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">F</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Desenfundar / Guardar Cuchillo de Dina</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">R</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Ataque con Cuchillo Equipado</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">Clic Izquierdo</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Esquivar a la Izquierda</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">Botón Ratón 4 o Q</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Esquivar a la Derecha</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">Botón Ratón 5</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Apuntar / Lanzar Botella Distracción</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">G o Clic Derecho</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Interactuar / Recoger / Curar</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">E</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Linterna Táctica</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">T</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center">
                <span className="text-stone-300">Inspeccionar Cuchillo</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">X</span>
              </div>
              <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-800/80 flex justify-between items-center col-span-2">
                <span className="text-stone-300">Mochila de Supervivencia y Fabricación</span>
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 rounded">Tab</span>
              </div>
            </div>
          )}

          {activeTab === 'graphics' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs font-mono text-stone-400">
                Ajusta el perfil de rendimiento gráfico para optimizar la tasa de fotogramas por segundo (FPS).
              </div>

              <div className="grid grid-cols-3 gap-4">
                {(['low', 'med', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => onSetQuality(q)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${
                      currentQuality === q
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    <span className="uppercase font-mono text-sm tracking-wider">
                      {q === 'low' ? 'Bajo' : q === 'med' ? 'Medio' : 'Alto'}
                    </span>
                    <span className="text-[11px] font-sans text-stone-500 text-center">
                      {q === 'low'
                        ? 'Sin sombras dinámicas, resolución estándar (Ideal para GPU integrada).'
                        : q === 'med'
                        ? 'Sombras estándar y niebla volumétrica.'
                        : 'Sombras suaves PCF, lluvia completa y alta fidelidad.'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="flex flex-col gap-6 max-w-md">
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span>Volumen General</span>
                  <span className="text-amber-400">{masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleMasterChange(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-stone-800 rounded-lg h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span>Música Melancólica y Acústica</span>
                  <span className="text-amber-400">{musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => handleMusicChange(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-stone-800 rounded-lg h-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Save / Load and Resume */}
        <div className="border-t border-stone-800 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 px-4 py-2 rounded-lg font-mono text-xs flex items-center gap-2 transition"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-amber-500" />}
              <span>{saveSuccess ? '¡Guardado con Éxito!' : 'Guardar Partida'}</span>
            </button>

            <button
              onClick={onLoadGame}
              className="bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 px-4 py-2 rounded-lg font-mono text-xs flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>Cargar Partida</span>
            </button>
          </div>

          <button
            onClick={onResume}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Reanudar Juego</span>
          </button>
        </div>
      </div>
    </div>
  );
};
