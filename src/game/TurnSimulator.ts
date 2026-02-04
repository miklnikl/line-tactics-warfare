import type { Regiment } from './Regiment.ts';

/**
 * TurnSimulator is responsible for simulating a full WEGO turn.
 * 
 * Design rules:
 * - No dependencies on rendering or UI
 * - Pure game logic only
 * - Deterministic and replayable
 * - Fixed number of ticks per turn
 */
export class TurnSimulator {
  private static readonly TICKS_PER_TURN = 100;
  private currentTick: number;
  private regiments: Regiment[];

  constructor(regiments: Regiment[] = []) {
    this.currentTick = 0;
    this.regiments = regiments;
  }

  /**
   * Get the fixed number of ticks per turn
   */
  static getTicksPerTurn(): number {
    return TurnSimulator.TICKS_PER_TURN;
  }

  /**
   * Get the current tick number
   */
  getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Get the list of regiments being simulated
   */
  getRegiments(): readonly Regiment[] {
    return this.regiments;
  }

  /**
   * Set the regiments to simulate
   */
  setRegiments(regiments: Regiment[]): void {
    this.regiments = regiments;
  }

  /**
   * Check if the turn has ended
   */
  isTurnComplete(): boolean {
    return this.currentTick >= TurnSimulator.TICKS_PER_TURN;
  }

  /**
   * Reset the simulator to the beginning of a turn
   */
  reset(): void {
    this.currentTick = 0;
  }

  /**
   * Simulate one tick of the turn
   * Updates all regiments for this tick
   * Returns true if the turn is still in progress, false if complete
   */
  simulateTick(): boolean {
    if (this.isTurnComplete()) {
      return false;
    }

    // Update all regiments for this tick
    for (const regiment of this.regiments) {
      regiment.updateTick();
    }

    this.currentTick++;

    return !this.isTurnComplete();
  }

  /**
   * Simulate the entire turn from start to finish
   * Runs all ticks until the turn is complete
   * Returns the number of ticks that were executed
   */
  simulateFullTurn(): number {
    this.reset();
    let ticksExecuted = 0;

    while (this.simulateTick()) {
      ticksExecuted++;
    }

    return ticksExecuted;
  }
}
