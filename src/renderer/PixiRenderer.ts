import { Application, Container, Graphics } from 'pixi.js';
import type { GameState } from '../game/GameState.ts';
import type { Unit } from '../game/Unit.ts';

/**
 * PixiRenderer is responsible for drawing the current GameState using PixiJS.
 * 
 * Design rules:
 * - Does NOT mutate game state
 * - Only READS from GameState
 * - Manages PixiJS stage and layers
 * - Renders regiments as simple rectangles
 */
export class PixiRenderer {
  private app: Application;
  private gameLayer: Container;
  private unitGraphics: Map<string, Graphics>;

  constructor(app: Application) {
    this.app = app;
    this.gameLayer = new Container();
    this.unitGraphics = new Map();
    
    // Add the game layer to the stage
    this.app.stage.addChild(this.gameLayer);
  }

  /**
   * Get the PixiJS application instance
   */
  getApplication(): Application {
    return this.app;
  }

  /**
   * Get the game layer container
   */
  getGameLayer(): Container {
    return this.gameLayer;
  }

  /**
   * Render the current game state
   * This method only reads from the game state and does not mutate it
   */
  render(gameState: GameState): void {
    const units = gameState.getUnits();
    const currentUnitIds = new Set<string>();

    // Update or create graphics for each unit
    for (const unit of units) {
      currentUnitIds.add(unit.id);
      this.renderUnit(unit);
    }

    // Remove graphics for units that no longer exist
    for (const [unitId, graphics] of this.unitGraphics.entries()) {
      if (!currentUnitIds.has(unitId)) {
        this.gameLayer.removeChild(graphics);
        this.unitGraphics.delete(unitId);
      }
    }
  }

  /**
   * Render a single unit as a rectangle
   * Only reads from the unit, does not mutate it
   */
  private renderUnit(unit: Unit): void {
    let graphics = this.unitGraphics.get(unit.id);

    if (!graphics) {
      // Create new graphics for this unit
      graphics = new Graphics();
      this.gameLayer.addChild(graphics);
      this.unitGraphics.set(unit.id, graphics);
    }

    // Clear previous drawing
    graphics.clear();

    // Draw the unit as a simple rectangle
    // Position is based on unit's x and y coordinates
    // Using a grid-based system: each unit is 40x40 pixels
    const gridSize = 40;
    const pixelX = unit.x * gridSize;
    const pixelY = unit.y * gridSize;
    const width = 30;
    const height = 30;

    graphics
      .rect(pixelX, pixelY, width, height)
      .fill(0xff0000); // Red color for units
  }

  /**
   * Clear all rendered units
   */
  clear(): void {
    for (const graphics of this.unitGraphics.values()) {
      this.gameLayer.removeChild(graphics);
    }
    this.unitGraphics.clear();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clear();
    this.app.stage.removeChild(this.gameLayer);
    this.gameLayer.destroy();
  }
}
