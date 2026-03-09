import React from 'react';

type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

interface CommandPanelProps {
  selectedRegimentId: string | null;
  phase: string;
  isMoveMode: boolean;
  onMove: () => void;
  onHold: () => void;
  onRotate: (direction: Direction) => void;
}

const DIRECTIONS: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

/**
 * CommandPanel – right section of the bottom HUD.
 * Renders command buttons for the selected regiment.
 * Shows a placeholder when no regiment is selected.
 *
 * Pure UI: delegates all game-state mutations to callback props.
 */
export const CommandPanel: React.FC<CommandPanelProps> = ({
  selectedRegimentId,
  phase,
  isMoveMode,
  onMove,
  onHold,
  onRotate,
}) => {
  const isDisabled = phase !== 'PLANNING' || !selectedRegimentId;

  return (
    <div className="bottom-panel__section bottom-panel__commands">
      <h3 className="bottom-panel__section-title">Commands</h3>

      {!selectedRegimentId ? (
        <div className="bottom-panel__placeholder">Select a regiment</div>
      ) : (
        <>
          <button
            className={`command-button${isMoveMode ? ' pressed' : ''}`}
            disabled={isDisabled}
            onClick={onMove}
            title="Select target tile on map (click again to cancel)"
          >
            MOVE
          </button>
          <button
            className="command-button"
            disabled={isDisabled}
            onClick={onHold}
            title="Hold current position"
          >
            HOLD
          </button>
          <div className="direction-buttons-container">
            {DIRECTIONS.map(dir => (
              <button
                key={dir}
                className="command-button direction-button"
                disabled={isDisabled}
                onClick={() => onRotate(dir)}
                title={`Rotate to face ${dir}`}
              >
                {dir}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
