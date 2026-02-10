import type { Application } from 'pixi.js';
import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { PixiRenderer } from '../renderer/PixiRenderer.ts';

/**
 * InputHandler manages user input for the game.
 * 
 * Design rules:
 * - Handles input events from the canvas
 * - Delegates game logic changes to GameState
 * - Does not contain game logic itself
 * - Works only during PLANNING phase
 */
export class InputHandler {
  private app: Application;
  private gameState: GameState;
  private regiments: Regiment[];
  private renderer: PixiRenderer;

  constructor(
    app: Application,
    gameState: GameState,
    regiments: Regiment[],
    renderer: PixiRenderer
  ) {
    this.app = app;
    this.gameState = gameState;
    this.regiments = regiments;
    this.renderer = renderer;

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for canvas interactions
   */
  private setupEventListeners(): void {
    // Listen for click events on the canvas
    this.app.canvas.addEventListener('click', this.handleClick);
  }

  /**
   * Handle click events on the canvas
   */
  private handleClick = (event: MouseEvent): void => {
    // Only allow selection during PLANNING phase
    if (this.gameState.getPhase() !== 'PLANNING') {
      return;
    }

    // Get click position relative to canvas
    const rect = this.app.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Convert screen coordinates to grid coordinates using the renderer
    // This accounts for the map centering offset
    const { gridX, gridY } = this.renderer.screenToGrid(canvasX, canvasY);
    
    // Round to nearest tile center for isometric grid
    const roundedX = Math.round(gridX);
    const roundedY = Math.round(gridY);

    // Find if any regiment was clicked
    const clickedRegiment = this.findRegimentAtPosition(roundedX, roundedY);

    if (clickedRegiment) {
      // Select the clicked regiment
      this.gameState.setSelectedRegimentId(clickedRegiment.getId());
    } else {
      // Clear selection if clicking empty space
      this.gameState.setSelectedRegimentId(null);
    }
  };

  /**
   * Find a regiment at the given grid position
   * Returns the regiment if found, null otherwise
   */
  private findRegimentAtPosition(gridX: number, gridY: number): Regiment | null {
    // Check each regiment to see if it's at this position
    // Use a tolerance for clicking near a regiment
    const tolerance = 1.0;

    for (const regiment of this.regiments) {
      const dx = Math.abs(regiment.getX() - gridX);
      const dy = Math.abs(regiment.getY() - gridY);

      // Check if the click is within tolerance of the regiment
      if (dx <= tolerance && dy <= tolerance) {
        return regiment;
      }
    }

    return null;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.app.canvas.removeEventListener('click', this.handleClick);
  }
}
