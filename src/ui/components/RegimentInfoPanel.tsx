import React from 'react';
import type { RegimentDisplayData } from '../../hooks/useGameState';

interface RegimentInfoPanelProps {
  regiment: RegimentDisplayData | null;
  phase: string;
}

/**
 * RegimentInfoPanel – center section of the bottom HUD.
 * Displays stats for the currently selected regiment, or a placeholder when
 * none is selected.
 *
 * Pure UI: reads props only, no game logic.
 */
export const RegimentInfoPanel: React.FC<RegimentInfoPanelProps> = ({ regiment, phase }) => {
  return (
    <div className="bottom-panel__section bottom-panel__regiment-info">
      <h3 className="bottom-panel__section-title">Regiment Info</h3>

      {!regiment ? (
        <div className="bottom-panel__placeholder">No regiment selected</div>
      ) : (
        <>
          {phase === 'SIMULATION' && (
            <div className="bottom-panel__badge bottom-panel__badge--readonly">READ-ONLY</div>
          )}
          <div className="bottom-panel__info-row">
            <span className="bottom-panel__info-label">ID:</span>
            <span className="bottom-panel__info-value">{regiment.id}</span>
          </div>
          <div className="bottom-panel__info-row">
            <span className="bottom-panel__info-label">Position:</span>
            <span className="bottom-panel__info-value">
              ({regiment.x.toFixed(1)}, {regiment.y.toFixed(1)})
            </span>
          </div>
          <div className="bottom-panel__info-row">
            <span className="bottom-panel__info-label">Facing:</span>
            <span className="bottom-panel__info-value">{regiment.direction}</span>
          </div>
          <div className="bottom-panel__info-row">
            <span className="bottom-panel__info-label">Order:</span>
            <span className="bottom-panel__info-value">{regiment.orderText}</span>
          </div>
        </>
      )}
    </div>
  );
};
