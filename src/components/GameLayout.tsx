import React from 'react';
import type { Application } from 'pixi.js';
import { GameField } from './GameField';

interface GameLayoutProps {
  onAppReady?: (app: Application) => void;
  children?: React.ReactNode;
  bottomPanel?: React.ReactNode;
}

/**
 * GameLayout component that provides the structural layout for the game.
 *
 * Layout Structure:
 * - Flex-column container that fills the viewport
 * - GameField (canvas layer) - flex: 1, fills all space above the bottom panel
 * - HUD overlay (absolute positioned inside canvas layer) - z-index: 10
 * - BottomPanel - fixed-height strip at the bottom, outside the canvas layer
 *
 * Design Principles:
 * - Canvas and UI are cleanly separated using CSS positioning and z-index
 * - Canvas fills all available space above the bottom panel
 * - HUD overlays above canvas without interfering with game rendering
 * - Bottom panel never overlaps the canvas (flex column, not stacked via z-index)
 */
export const GameLayout: React.FC<GameLayoutProps> = ({ onAppReady, children, bottomPanel }) => {
  return (
    <div className="game-layout">
      {/* Canvas layer: fills all space above the bottom panel */}
      <div className="game-layout__canvas-layer">
        <GameField onAppReady={onAppReady} />

        {/* HUD overlay: absolutely positioned within the canvas layer */}
        <div className="game-layout__hud-layer">
          {children}
        </div>
      </div>

      {/* Bottom panel: fixed-height strip, outside the canvas layer */}
      {bottomPanel}
    </div>
  );
};
