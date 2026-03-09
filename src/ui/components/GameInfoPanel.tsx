import React from 'react';
import type { GamePhase } from '../../game/GameState';

interface GameInfoPanelProps {
  phase: GamePhase;
  onEndTurn: () => void;
}

/**
 * GameInfoPanel – left section of the bottom HUD.
 * Displays game-level information and hosts the End Turn button.
 *
 * Pure UI: reads props only, no game logic.
 */
export const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ phase, onEndTurn }) => {
  const isPlanning = phase === 'PLANNING';

  return (
    <div className="bottom-panel__section bottom-panel__game-info">
      <h3 className="bottom-panel__section-title">Game Info</h3>
      <div className="bottom-panel__info-row">
        <span className="bottom-panel__info-label">Phase:</span>
        <span
          className={`bottom-panel__info-value ${
            phase === 'SIMULATION' ? 'bottom-panel__info-value--simulation' : ''
          }`}
        >
          {phase}
        </span>
      </div>
      <div className="bottom-panel__end-turn">
        <button
          className="bottom-panel__end-turn-button"
          disabled={!isPlanning}
          onClick={onEndTurn}
        >
          End Turn
        </button>
      </div>
    </div>
  );
};
