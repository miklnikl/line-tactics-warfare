import type { GameState } from './GameState.ts';
import { TurnSimulator } from './TurnSimulator.ts';

/**
 * GameLoop manages the main WEGO game loop using requestAnimationFrame.
 * 
 * Design rules:
 * - No dependencies on PixiJS or rendering
 * - Pure game logic orchestration
 * - Runs continuously and manages simulation phase
 * - Automatically stops simulation when turn ends
 */
export class GameLoop {
  private gameState: GameState;
  private turnSimulator: TurnSimulator;
  private animationFrameId: number | null;
  private isRunning: boolean;

  constructor(gameState: GameState, turnSimulator: TurnSimulator) {
    this.gameState = gameState;
    this.turnSimulator = turnSimulator;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  /**
   * Start the game loop
   * The loop will run continuously using requestAnimationFrame
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.loop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Check if the game loop is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Main game loop function
   * Called continuously by requestAnimationFrame
   * 
   * Note: The loop runs continuously on every frame, even during PLANNING phase.
   * This is intentional to allow immediate responsiveness when transitioning
   * between phases and to support future features like rendering updates.
   */
  private loop = (): void => {
    if (!this.isRunning) {
      return;
    }

    // During SIMULATION phase, advance the turn simulator
    if (this.gameState.getPhase() === 'SIMULATION') {
      const turnContinues = this.turnSimulator.simulateTick();
      
      // If turn is complete, end the simulation phase
      if (!turnContinues) {
        this.gameState.endTurn();
      }
    }

    // Schedule the next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
