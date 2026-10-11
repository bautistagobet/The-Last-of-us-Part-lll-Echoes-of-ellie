/**
 * THE LAST OF US PART III: ECHOES OF ELLIE
 * Main React Application Entry Point
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameEngineState } from './game/GameEngine';
import { HUD } from './components/HUD';
import { GrappleOverlay } from './components/GrappleOverlay';
import { BackpackModal } from './components/BackpackModal';
import { InspectKnifeModal } from './components/InspectKnifeModal';
import { PrologueModal } from './components/PrologueModal';
import { PauseMenu } from './components/PauseMenu';
import { CraftingRecipe } from './game/systems/InventorySystem';
import { soundEngine } from './game/audio/SoundSystem';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Modals & Overlays
  const [showPrologue, setShowPrologue] = useState<boolean>(true);
  const [showBackpack, setShowBackpack] = useState<boolean>(false);
  const [showInspectKnife, setShowInspectKnife] = useState<boolean>(false);
  const [showPauseMenu, setShowPauseMenu] = useState<boolean>(false);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'med' | 'high'>('high');

  // Real-time engine state for HUD
  const [engineState, setEngineState] = useState<GameEngineState>({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    injuries: {
      head: 0,
      torso: 15,
      leftArm: 0,
      rightArm: 0,
      leftLeg: 20,
      rightLeg: 0,
      isBleeding: false,
    },
    knifeDrawn: false,
    knifeDurability: 100,
    isLeaning: false,
    leanSide: 'none',
    isGrappling: false,
    grappleProgress: 0,
    grappleMashKey: 'F',
    isAimingBottle: false,
    bottlesCount: 2,
    medkitsCount: 1,
    isCrouching: false,
    isSprinting: false,
    noiseLevel: 35,
    flashlightOn: true,
    interactionPrompt: null,
    currentObjective: 'Explora las ruinas del complejo médico de Salt Lake en busca de pistas de Ellie.',
    isInspectingKnife: false,
  });

  // Initialize Three.js Game Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, (state) => {
      setEngineState(state);
    });
    engineRef.current = engine;

    // Global Key Listener for Tab (Backpack) and Escape (Menu)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowBackpack((prev) => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        setShowBackpack(false);
        setShowInspectKnife(false);
        setShowPauseMenu((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
    };
  }, []);

  const handleStartGame = () => {
    soundEngine.init();
    soundEngine.resume();
    setShowPrologue(false);
  };

  const handleCraftRecipe = (recipe: CraftingRecipe) => {
    if (engineRef.current) {
      engineRef.current.inventorySystem.craft(recipe);
    }
  };

  const handleSharpenKnife = () => {
    if (engineRef.current) {
      const inv = engineRef.current.inventorySystem;
      if (inv.supplies.blades >= 1 && inv.supplies.tape >= 1) {
        inv.supplies.blades--;
        inv.supplies.tape--;
        engineRef.current.combatSystem.sharpenKnife(40);
        soundEngine.playCraft();
      }
    }
  };

  const handleQualityChange = (q: 'low' | 'med' | 'high') => {
    setGraphicsQuality(q);
    if (engineRef.current) {
      engineRef.current.setQuality(q);
    }
  };

  const handleSaveGame = () => {
    if (engineRef.current) {
      engineRef.current.inventorySystem.saveGame();
    }
  };

  const handleLoadGame = () => {
    if (engineRef.current) {
      engineRef.current.inventorySystem.loadGame();
    }
  };

  const hasSharpenMats =
    engineRef.current
      ? engineRef.current.inventorySystem.supplies.blades >= 1 &&
        engineRef.current.inventorySystem.supplies.tape >= 1
      : false;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />

      {/* Crosshair when aiming bottle */}
      {engineState.isAimingBottle && !showBackpack && !showPauseMenu && !showPrologue && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-emerald-400/80 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      )}

      {/* Critical Health Red Vignette & Heartbeat pulsing effect */}
      {engineState.health < 35 && !showPrologue && (
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-red-950/20 border-[12px] border-red-700/50 animate-pulse" />
      )}

      {/* Bleeding Blood Splatter indicator */}
      {engineState.injuries.isBleeding && !showPrologue && (
        <div className="absolute top-0 right-0 p-4 pointer-events-none text-red-500 font-mono text-xs font-bold animate-pulse">
          ¡HEMORRAGIA ACTIVA! Usa un botiquín para vendarte
        </div>
      )}

      {/* Main HUD */}
      {!showPrologue && !showPauseMenu && !showBackpack && !showInspectKnife && (
        <HUD
          state={engineState}
          onOpenBackpack={() => setShowBackpack(true)}
          onInspectKnife={() => setShowInspectKnife(true)}
          onOpenMenu={() => setShowPauseMenu(true)}
        />
      )}

      {/* Grapple / Forcejeo Struggle QTE Overlay */}
      {engineState.isGrappling && !showPrologue && (
        <GrappleOverlay
          progress={engineState.grappleProgress}
          mashKey={engineState.grappleMashKey}
        />
      )}

      {/* Backpack & Crafting Modal */}
      {showBackpack && engineRef.current && (
        <BackpackModal
          onClose={() => setShowBackpack(false)}
          inventory={engineRef.current.inventorySystem}
          onCraftRecipe={handleCraftRecipe}
        />
      )}

      {/* Inspect Dina's Knife Modal */}
      {showInspectKnife && (
        <InspectKnifeModal
          onClose={() => setShowInspectKnife(false)}
          durability={engineState.knifeDurability}
          onSharpen={handleSharpenKnife}
          hasSharpenMaterials={hasSharpenMats}
        />
      )}

      {/* Pause & Settings Menu */}
      {showPauseMenu && (
        <PauseMenu
          onResume={() => setShowPauseMenu(false)}
          onSaveGame={handleSaveGame}
          onLoadGame={handleLoadGame}
          currentQuality={graphicsQuality}
          onSetQuality={handleQualityChange}
        />
      )}

      {/* Story Prologue & Introduction */}
      {showPrologue && <PrologueModal onStartGame={handleStartGame} />}
    </div>
  );
}
