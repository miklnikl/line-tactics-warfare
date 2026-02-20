import { useState, useEffect } from 'react';
import type { GamePhase } from '../game/GameState';
import { gameState } from '../game/GameService';

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
