import { Application, Container, Graphics } from 'pixi.js';
import type { GameState } from '../game/GameState.ts';
import type { GameMap } from '../game/GameMap.ts';
import type { Unit } from '../game/Unit.ts';
import { gridToIso, type IsoConfig, DEFAULT_ISO_CONFIG } from '../utils/iso.ts';

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
  private isoConfig: IsoConfig;

  constructor(app: Application, isoConfig: IsoConfig = DEFAULT_ISO_CONFIG) {
    this.app = app;
    this.gameLayer = new Container();
    this.unitGraphics = new Map();
    this.isoConfig = isoConfig;
    
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
    const map = gameState.getMap();
    const currentUnitIds = new Set<string>();

    // Update or create graphics for each unit
    for (const unit of units) {
      currentUnitIds.add(unit.id);
      this.renderUnit(unit, map);
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
  private renderUnit(unit: Unit, map: GameMap): void {
    let graphics = this.unitGraphics.get(unit.id);

    if (!graphics) {
      // Create new graphics for this unit
      graphics = new Graphics();
      this.gameLayer.addChild(graphics);
      this.unitGraphics.set(unit.id, graphics);
    }

    // Clear previous drawing
    graphics.clear();

    // Get the terrain height at the unit's position
    // Default to 0 if the unit is outside map bounds
    let height = 0;
    try {
      if (map.isValidPosition(unit.x, unit.y)) {
        height = map.getTileHeight(unit.x, unit.y);
      }
    } catch (error) {
      // Fallback to 0 height if there's any issue querying the map
      console.warn(`Unable to get terrain height for unit at (${unit.x}, ${unit.y}):`, error);
    }

    // Convert grid coordinates to isometric screen coordinates
    // The height parameter adjusts the vertical position based on terrain elevation
    const { isoX, isoY } = gridToIso(unit.x, unit.y, height, this.isoConfig);
    
    // Draw the unit as a simple rectangle
    // Position is based on isometric coordinates
    const width = 30;
    const unitHeight = 30;

    graphics
      .rect(isoX, isoY, width, unitHeight)
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
