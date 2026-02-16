import React from 'react'
import './style.css'

/**
 * Root React component for the Line Tactics Warfare application.
 * Provides layout structure for the game canvas and HUD elements.
 * Game logic remains external to React.
 */
export const App: React.FC = () => {
  return (
    <div className="app-container">
      {/* Canvas container - will be populated by PixiJS */}
      <div id="game-canvas" />
      
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
