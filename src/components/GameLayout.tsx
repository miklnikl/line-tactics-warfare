import React from 'react';
import type { Application } from 'pixi.js';
import { GameField } from './GameField';

interface GameLayoutProps {
  onAppReady?: (app: Application) => void;
  children?: React.ReactNode;
}

/**
 * GameLayout component that provides the structural layout for the game.
 * 
 * Layout Structure:
 * - Fullscreen container that fills the viewport
 * - GameField (canvas layer) - fills available space, z-index: 1
 * - HUD overlay (absolute positioned) - overlays above canvas, z-index: 10
 * 
 * Design Principles:
 * - Canvas and UI are cleanly separated using CSS positioning and z-index
 * - Canvas fills all available space responsively
 * - HUD overlays above canvas without interfering with game rendering
 * - No UI elements are rendered inside the Pixi canvas
 */
export const GameLayout: React.FC<GameLayoutProps> = ({ onAppReady, children }) => {
  return (
    <div className="game-layout">
      {/* Canvas Layer: PixiJS game rendering */}
      <div className="game-layout__canvas-layer">
        <GameField onAppReady={onAppReady} />
      </div>
      
      {/* HUD Layer: UI overlay (absolutely positioned above canvas) */}
      <div className="game-layout__hud-layer">
        {children}
      </div>
    </div>
  );
};
