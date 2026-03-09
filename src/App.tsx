import React from 'react'
import './style.css'
import { GameLayout } from './components/GameLayout'
import type { Application } from 'pixi.js'
import {
  useGamePhase,
  useSelectedRegimentId,
  useSelectedRegimentData,
  useMoveMode,
} from './hooks/useGameState'
import { BottomPanel } from './ui/components/BottomPanel'
import { commandService } from './game/CommandService'

interface AppProps {
  onAppReady?: (app: Application) => void;
}

/**
 * Root React component for the Line Tactics Warfare application.
 * Provides layout structure for the game canvas and the fixed bottom HUD.
 * Game logic remains external to React; state changes are received via the
 * useGamePhase / useSelectedRegimentId subscription hooks.
 */
export const App: React.FC<AppProps> = ({ onAppReady }) => {
  const phase = useGamePhase();
  const selectedRegimentId = useSelectedRegimentId();
  const regiment = useSelectedRegimentData();
  const isMoveMode = useMoveMode();

  return (
    <GameLayout
      onAppReady={onAppReady}
      bottomPanel={
        <BottomPanel
          phase={phase}
          selectedRegimentId={selectedRegimentId}
          regiment={regiment}
          isMoveMode={isMoveMode}
          onMove={() => commandService.move()}
          onHold={() => commandService.hold()}
          onRotate={(dir) => commandService.rotate(dir)}
          onEndTurn={() => commandService.endTurn()}
          onRemoveOrder={(index) => commandService.removeOrder(index)}
          onMoveOrderUp={(index) => commandService.moveOrderUp(index)}
          onMoveOrderDown={(index) => commandService.moveOrderDown(index)}
        />
      }
    >
      {/* Legacy hidden DOM targets required by imperative RegimentInfoPanel.ts / CommandPanel.ts */}
      <div id="regiment-info-panel" className="info-panel--hidden-legacy" />
      <div id="command-panel" className="command-panel--hidden-legacy" />
    </GameLayout>
  )
}

