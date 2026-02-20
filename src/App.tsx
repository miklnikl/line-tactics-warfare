import React from 'react'
import './style.css'
import { GameLayout } from './components/GameLayout'
import type { Application } from 'pixi.js'
import { useGamePhase, useSelectedRegimentId } from './hooks/useGameState'

interface AppProps {
  onAppReady?: (app: Application) => void;
}

/**
 * Root React component for the Line Tactics Warfare application.
 * Provides layout structure for the game canvas and HUD elements.
 * Game logic remains external to React; state changes are received
 * via the useGamePhase / useSelectedRegimentId subscription hooks.
 */
export const App: React.FC<AppProps> = ({ onAppReady }) => {
  const phase = useGamePhase();
  const selectedRegimentId = useSelectedRegimentId();

  return (
    <GameLayout onAppReady={onAppReady}>
      {/* Phase indicator - re-renders reactively on phase change */}
      <div
        className={`phase-indicator phase-${phase.toLowerCase()}`}
      >
        Phase: {phase}
      </div>
      {/* Regiment info and command panels are populated imperatively by the game layer.
          The data-selected attribute exposes the React-managed selection state to those
          imperative consumers in this hybrid DOM/React architecture. */}
      <div id="regiment-info-panel" className="info-panel" data-selected={selectedRegimentId ?? ''} />
      <div id="command-panel" className="command-panel" />
      {/* End Turn button - disabled reactively during SIMULATION */}
      <button id="end-turn-button" disabled={phase !== 'PLANNING'}>
        End Turn
      </button>
    </GameLayout>
  )
}

