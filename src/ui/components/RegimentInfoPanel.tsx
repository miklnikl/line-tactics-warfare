import React from 'react';
import type { RegimentDisplayData } from '../../hooks/useGameState';

interface RegimentInfoPanelProps {
  regiment: RegimentDisplayData | null;
  phase: string;
  onRemoveOrder: (index: number) => void;
  onMoveOrderUp: (index: number) => void;
  onMoveOrderDown: (index: number) => void;
}

/**
 * RegimentInfoPanel – center section of the bottom HUD.
 * Displays stats for the currently selected regiment, or a placeholder when
 * none is selected. Shows a table of queued orders (max 3) with controls to
 * remove or reorder them.
 *
 * Pure UI: reads props only, no game logic.
 */
export const RegimentInfoPanel: React.FC<RegimentInfoPanelProps> = ({
  regiment,
  phase,
  onRemoveOrder,
  onMoveOrderUp,
  onMoveOrderDown,
}) => {
  const isReadOnly = phase === 'SIMULATION';

  return (
    <div className="bottom-panel__section bottom-panel__regiment-info">
      <h3 className="bottom-panel__section-title">Regiment Info</h3>

      {!regiment ? (
        <div className="bottom-panel__placeholder">No regiment selected</div>
      ) : (
        <>
          {isReadOnly && (
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

          <div className="bottom-panel__orders-section">
            <span className="bottom-panel__info-label">
              Orders ({regiment.orders.length}/3):
            </span>
            {regiment.orders.length === 0 ? (
              <span className="bottom-panel__placeholder bottom-panel__placeholder--inline">
                None
              </span>
            ) : (
              <table className="orders-table">
                <tbody>
                  {regiment.orders.map((order, index) => (
                    <tr key={index} className="orders-table__row">
                      <td className="orders-table__index">{index + 1}</td>
                      <td className="orders-table__desc">{order.description}</td>
                      <td className="orders-table__actions">
                        <button
                          className="orders-table__btn"
                          disabled={isReadOnly || index === 0}
                          onClick={() => onMoveOrderUp(index)}
                          title="Move order up"
                        >
                          ↑
                        </button>
                        <button
                          className="orders-table__btn"
                          disabled={isReadOnly || index === regiment.orders.length - 1}
                          onClick={() => onMoveOrderDown(index)}
                          title="Move order down"
                        >
                          ↓
                        </button>
                        <button
                          className="orders-table__btn orders-table__btn--remove"
                          disabled={isReadOnly}
                          onClick={() => onRemoveOrder(index)}
                          title="Remove order"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};
