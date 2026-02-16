import React from 'react'
import './style.css'
import { GameField } from './components/GameField'
import type { Application } from 'pixi.js'

interface AppProps {
  onAppReady?: (app: Application) => void;
}

/**
 * Root React component for the Line Tactics Warfare application.
 * Provides layout structure for the game canvas and HUD elements.
 * Game logic remains external to React.
 */
export const App: React.FC<AppProps> = ({ onAppReady }) => {
  return (
    <div className="app-container">
      {/* GameField component - manages PixiJS canvas lifecycle */}
      <GameField onAppReady={onAppReady} />
      
      {/* HUD container for UI overlays */}
      <div className="hud-container">
        <div id="phase-indicator" className="phase-indicator">
          Phase: PLANNING
        </div>
        <div id="regiment-info-panel" className="info-panel" />
        <div id="command-panel" className="command-panel" />
        <button id="end-turn-button">End Turn</button>
      </div>
    </div>
  )
}
