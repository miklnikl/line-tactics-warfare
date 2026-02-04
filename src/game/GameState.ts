import type { Unit } from './Unit.ts';

/**
 * Game phase for WEGO turn system
 */
export type GamePhase = 'PLANNING' | 'SIMULATION';

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

  constructor() {
    this.phase = 'PLANNING';
    this.tick = 0;
    this.units = [];
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
   * Get the list of units
   */
  getUnits(): readonly Unit[] {
    return this.units;
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
    }
  }

  /**
   * End the current turn by transitioning back to PLANNING phase
   */
  endTurn(): void {
    if (this.phase === 'SIMULATION') {
      this.phase = 'PLANNING';
      this.tick = 0;
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
