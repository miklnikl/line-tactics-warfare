import { useState, useEffect } from 'react';
import type { GamePhase } from '../game/GameState';
import { gameState, regimentRegistry } from '../game/GameService';
import { commandService } from '../game/CommandService';
import type { Order } from '../game/Order';

/**
 * React hook that subscribes to GameState phase changes.
 * Re-renders the consuming component whenever the game phase transitions.
 * Automatically unsubscribes on component unmount.
 */
export function useGamePhase(): GamePhase {
  const [phase, setPhase] = useState<GamePhase>(() => gameState.getPhase());

  useEffect(() => {
    return gameState.onPhaseChange(setPhase);
  }, []);

  return phase;
}

/**
 * React hook that subscribes to GameState selected regiment changes.
 * Re-renders the consuming component whenever the selected regiment changes.
 * Automatically unsubscribes on component unmount.
 */
export function useSelectedRegimentId(): string | null {
  const [selectedId, setSelectedId] = useState<string | null>(() => gameState.getSelectedRegimentId());

  useEffect(() => {
    return gameState.onSelectionChange(setSelectedId);
  }, []);

  return selectedId;
}

/** Single order entry exposed to pure-UI React components. */
export interface OrderDisplayData {
  type: string;
  description: string;
}

/** Data shape exposed to pure-UI React components. */
export interface RegimentDisplayData {
  id: string;
  x: number;
  y: number;
  direction: string;
  orders: OrderDisplayData[];
}

function formatOrderDescription(order: Order): string {
  if (order.type === 'MOVE') {
    return `MOVE to (${order.targetState.x}, ${order.targetState.y})`;
  }
  return order.type;
}

/**
 * React hook that returns display data for the currently selected regiment.
 * Updates when selection changes and polls every 200 ms so that order / position
 * changes (e.g. during simulation) are reflected in the UI without requiring a
 * full event system on the Regiment class.
 */
export function useSelectedRegimentData(): RegimentDisplayData | null {
  const selectedId = useSelectedRegimentId();
  const [data, setData] = useState<RegimentDisplayData | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }

    function refresh(): void {
      if (!selectedId) return;
      const regiment = regimentRegistry.get(selectedId);
      if (!regiment) {
        setData(null);
        return;
      }
      setData({
        id: regiment.getId(),
        x: regiment.getX(),
        y: regiment.getY(),
        direction: regiment.getDirection(),
        orders: [...regiment.getOrders()].map(o => ({
          type: o.type,
          description: formatOrderDescription(o),
        })),
      });
    }

    refresh();
    const intervalId = setInterval(refresh, 200);
    return () => clearInterval(intervalId);
  }, [selectedId]);

  return data;
}

/**
 * React hook that tracks whether the game is currently in "move target selection" mode.
 * Driven by the imperative CommandPanel via commandService.
 */
export function useMoveMode(): boolean {
  const [isMoveMode, setIsMoveMode] = useState(() => commandService.isMoveMode);

  useEffect(() => {
    return commandService.onMoveModeChange(setIsMoveMode);
  }, []);

  return isMoveMode;
}

