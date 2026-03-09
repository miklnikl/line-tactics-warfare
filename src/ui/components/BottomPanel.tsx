import React from 'react';
import type { GamePhase } from '../../game/GameState';
import type { RegimentDisplayData } from '../../hooks/useGameState';
import { GameInfoPanel } from './GameInfoPanel';
import { RegimentInfoPanel } from './RegimentInfoPanel';
import { CommandPanel } from './CommandPanel';

type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

interface BottomPanelProps {
  phase: GamePhase;
  selectedRegimentId: string | null;
  regiment: RegimentDisplayData | null;
  isMoveMode: boolean;
  onMove: () => void;
  onHold: () => void;
  onRotate: (direction: Direction) => void;
  onEndTurn: () => void;
}

/**
 * BottomPanel – fixed-height RTS-style HUD at the bottom of the screen.
 *
 * Layout (CSS Grid):
 *   | 25% Game Info | 50% Regiment Info | 25% Commands |
 *
 * Design rules:
 * - Fixed height (set via CSS), never resizes with content
 * - Spans full viewport width
 * - Pure UI: all data received via props, no game logic embedded
 */
export const BottomPanel: React.FC<BottomPanelProps> = ({
  phase,
  selectedRegimentId,
  regiment,
  isMoveMode,
  onMove,
  onHold,
  onRotate,
  onEndTurn,
}) => {
  return (
    <div className="bottom-panel">
      <GameInfoPanel phase={phase} onEndTurn={onEndTurn} />
      <RegimentInfoPanel regiment={regiment} phase={phase} />
      <CommandPanel
        selectedRegimentId={selectedRegimentId}
        phase={phase}
        isMoveMode={isMoveMode}
        onMove={onMove}
        onHold={onHold}
        onRotate={onRotate}
      />
    </div>
  );
};
