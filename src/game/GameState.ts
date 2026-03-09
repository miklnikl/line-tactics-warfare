import type { Unit } from './Unit.ts';
import { GameMap } from './GameMap.ts';

/**
 * Game phase for WEGO turn system
 */
export type GamePhase = 'PLANNING' | 'SIMULATION';

type PhaseChangeListener = (phase: GamePhase) => void;
type SelectionChangeListener = (regimentId: string | null) => void;

/**
 * GameState stores the complete game state for a WEGO-based strategy game.
 * 
 * Design rules:
 * - No dependencies on rendering or UI
 * - Pure game logic only
 * - Deterministic and replayable
 */
export class GameState {
  private phase: GamePhase;
  private tick: number;
  private units: Unit[];
  private map: GameMap;
  private selectedRegimentId: string | null;
  private phaseListeners: Set<PhaseChangeListener>;
  private selectionListeners: Set<SelectionChangeListener>;

  constructor(map?: GameMap) {
    this.phase = 'PLANNING';
    this.tick = 0;
    this.units = [];
    // Use provided map or create a default 20x20 map
    this.map = map ?? new GameMap(20, 20);
    this.selectedRegimentId = null;
    this.phaseListeners = new Set();
    this.selectionListeners = new Set();
  }

  /**
   * Subscribe to phase changes. Returns an unsubscribe function.
   */
  onPhaseChange(listener: PhaseChangeListener): () => void {
    this.phaseListeners.add(listener);
    return () => { this.phaseListeners.delete(listener); };
  }

  /**
   * Subscribe to selected regiment changes. Returns an unsubscribe function.
   */
  onSelectionChange(listener: SelectionChangeListener): () => void {
    this.selectionListeners.add(listener);
    return () => { this.selectionListeners.delete(listener); };
  }

  /**
   * Get the current game phase
   */
  getPhase(): GamePhase {
    return this.phase;
  }

  /**
   * Get the current tick
   */
  getTick(): number {
    return this.tick;
  }

  /**
   * Get the list of units (returns a shallow copy)
   * Note: The returned array is a copy, but the Unit objects themselves are not cloned
   */
  getUnits(): readonly Unit[] {
    return [...this.units];
  }

  /**
   * Get the game map
   */
  getMap(): GameMap {
    return this.map;
  }

  /**
   * Add a unit to the game state
   */
  addUnit(unit: Unit): void {
    this.units.push(unit);
  }

  /**
   * Start a new turn by transitioning to the SIMULATION phase
   */
  startTurn(): void {
    if (this.phase === 'PLANNING') {
      this.phase = 'SIMULATION';
      this.tick = 0;
      this.phaseListeners.forEach(l => l(this.phase));
    }
  }

  /**
   * End the current turn by transitioning back to PLANNING phase
   */
  endTurn(): void {
    if (this.phase === 'SIMULATION') {
      this.phase = 'PLANNING';
      this.tick = 0;
      this.phaseListeners.forEach(l => l(this.phase));
    }
  }

  /**
   * Get the currently selected regiment ID
   */
  getSelectedRegimentId(): string | null {
    return this.selectedRegimentId;
  }

  /**
   * Set the selected regiment ID
   * Can only be set during PLANNING phase
   * Pass null to clear selection
   */
  setSelectedRegimentId(regimentId: string | null): void {
    if (this.phase === 'PLANNING' && this.selectedRegimentId !== regimentId) {
      this.selectedRegimentId = regimentId;
      this.selectionListeners.forEach(l => l(this.selectedRegimentId));
    }
  }

  /**
   * Advance the simulation by one tick
   * Only works during SIMULATION phase
   */
  advanceTick(): void {
    if (this.phase === 'SIMULATION') {
      this.tick++;
    }
  }
}
