import React, { useState } from 'react';
import { 
  X, 
  Hammer, 
  BookOpen, 
  Package, 
  Bandage, 
  Flame, 
  Cloud, 
  Sparkles,
  FileText
} from 'lucide-react';
import { InventorySystem, CRAFTING_RECIPES, CraftingRecipe } from '../game/systems/InventorySystem';

interface BackpackModalProps {
  onClose: () => void;
  inventory: InventorySystem;
  onCraftRecipe: (recipe: CraftingRecipe) => void;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({
  onClose,
  inventory,
  onCraftRecipe,
}) => {
  const [activeTab, setActiveTab] = useState<'crafting' | 'journal' | 'supplies'>('crafting');
  const [selectedNote, setSelectedNote] = useState<any>(
    inventory.collectedNotes.length > 0 ? inventory.collectedNotes[0] : null
  );

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="relative max-w-4xl w-full h-[620px] bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col text-stone-200">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-serif font-bold text-stone-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              <span>Mochila de Supervivencia</span>
            </h1>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-stone-900/80 p-1 rounded-lg border border-stone-800">
              <button
                onClick={() => setActiveTab('crafting')}
                className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition ${
                  activeTab === 'crafting'
                    ? 'bg-amber-600 text-black font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Fabricar</span>
              </button>

              <button
                onClick={() => setActiveTab('journal')}
                className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition ${
                  activeTab === 'journal'
                    ? 'bg-amber-600 text-black font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Diario y Notas ({inventory.collectedNotes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('supplies')}
                className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition ${
                  activeTab === 'supplies'
                    ? 'bg-amber-600 text-black font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Recursos</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Crafting Workbench */}
        {activeTab === 'crafting' && (
          <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-4">
            <div className="text-xs font-mono text-stone-400">
              Selecciona una receta para fabricar utilizando los suministros recolectados en el terreno.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CRAFTING_RECIPES.map((recipe) => {
                const canMake = inventory.canCraft(recipe);
                return (
                  <div
                    key={recipe.id}
                    className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 flex flex-col justify-between hover:border-stone-700 transition"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-amber-500 mb-3 border border-stone-700">
                        {recipe.id === 'craft_medkit' && <Bandage className="w-5 h-5 text-rose-400" />}
                        {recipe.id === 'craft_hone' && <Sparkles className="w-5 h-5 text-amber-400" />}
                        {recipe.id === 'craft_smoke' && <Cloud className="w-5 h-5 text-stone-300" />}
                      </div>

                      <h3 className="font-bold text-stone-100 text-base">{recipe.name}</h3>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {recipe.description}
                      </p>

                      {/* Required materials */}
                      <div className="mt-4 pt-3 border-t border-stone-800">
                        <div className="text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-2">
                          Materiales Requeridos:
                        </div>
                        <div className="flex flex-col gap-1 text-xs font-mono">
                          {Object.entries(recipe.cost).map(([item, req]) => {
                            const have = (inventory.supplies as any)[item] || 0;
                            const isEnough = have >= (req || 0);
                            return (
                              <div key={item} className="flex justify-between items-center">
                                <span className="capitalize text-stone-400">{item}:</span>
                                <span className={isEnough ? 'text-emerald-400' : 'text-red-400'}>
                                  {have} / {req}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onCraftRecipe(recipe)}
                      disabled={!canMake}
                      className={`mt-5 w-full py-2.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                        canMake
                          ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>{canMake ? 'Fabricar Objeto' : 'Materiales Insuficientes'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Journal & Notes Reader */}
        {activeTab === 'journal' && (
          <div className="flex-1 overflow-hidden py-4 flex gap-6">
            {/* Note selector list */}
            <div className="w-1/3 border-r border-stone-800 pr-4 flex flex-col gap-2 overflow-y-auto">
              <div className="text-xs font-mono uppercase text-stone-500 mb-1">
                Documentos Encontrados ({inventory.collectedNotes.length})
              </div>
              {inventory.collectedNotes.length === 0 ? (
                <div className="text-xs text-stone-500 italic p-4 text-center">
                  Aún no has recogido ninguna carta o pista. Explora los vehículos y edificios.
                </div>
              ) : (
                inventory.collectedNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`text-left p-3 rounded-lg border transition ${
                      selectedNote?.id === note.id
                        ? 'bg-stone-800 border-amber-600 text-white'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-100 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>{note.title}</span>
                    </div>
                    <div className="text-[10px] font-mono text-stone-500 mt-1">
                      {note.date} • {note.author}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Note display reader */}
            <div className="flex-1 bg-stone-900/40 border border-stone-800 rounded-xl p-6 overflow-y-auto font-serif">
              {selectedNote ? (
                <div>
                  <div className="border-b border-stone-800 pb-3 mb-4">
                    <h2 className="text-xl font-bold text-stone-100">{selectedNote.title}</h2>
                    <div className="text-xs font-mono text-amber-500/90 mt-1">
                      Fecha: {selectedNote.date} | Autor: {selectedNote.author}
                    </div>
                  </div>
                  <div className="text-stone-300 text-sm leading-relaxed whitespace-pre-line font-serif italic">
                    {selectedNote.content}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-stone-500 text-xs italic">
                  Selecciona una nota para leer su contenido.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Current Supplies Overview */}
        {activeTab === 'supplies' && (
          <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-4">
            <div className="text-xs font-mono text-stone-400">
              Resumen de todos los materiales, botiquines y botellas almacenados en tu inventario.
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(inventory.supplies).map(([name, amount]) => (
                <div
                  key={name}
                  className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <span className="capitalize font-mono text-sm text-stone-300">{name}</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-800 pt-3 flex justify-between items-center text-xs font-mono text-stone-400">
          <span>Presiona [Tab] o [ESC] para cerrar y volver al juego.</span>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-1.5 rounded transition"
          >
            Cerrar Mochila
          </button>
        </div>
      </div>
    </div>
  );
};
