import { Application, Container, Graphics } from 'pixi.js';
import type { GameState } from '../game/GameState.ts';
import type { GameMap } from '../game/GameMap.ts';
import type { Unit } from '../game/Unit.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { MoveOrder } from '../game/Order.ts';
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
  private orderVisualizationLayer: Container;
  private isoConfig: IsoConfig;

  // Visual constants for order visualization
  private static readonly UNIT_CENTER_OFFSET_X = 15; // Half of unit width (30/2)
  private static readonly UNIT_CENTER_OFFSET_Y = 15; // Half of unit height (30/2)
  private static readonly ARROW_HEAD_SIZE = 10;
  private static readonly HOLD_ORDER_CIRCLE_RADIUS = 25;

  constructor(app: Application, isoConfig: IsoConfig = DEFAULT_ISO_CONFIG) {
    this.app = app;
    this.gameLayer = new Container();
    this.unitGraphics = new Map();
    this.orderVisualizationLayer = new Container();
    this.isoConfig = isoConfig;
    
    // Add the game layer to the stage
    this.app.stage.addChild(this.gameLayer);
    // Add the order visualization layer on top
    this.app.stage.addChild(this.orderVisualizationLayer);
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
   * 
   * @param gameState - The game state to render
   * @param regiments - Optional array of regiments for order visualization
   */
  render(gameState: GameState, regiments?: readonly Regiment[]): void {
    const units = gameState.getUnits();
    const map = gameState.getMap();
    const selectedRegimentId = gameState.getSelectedRegimentId();
    const currentUnitIds = new Set<string>();

    // Update or create graphics for each unit
    for (const unit of units) {
      currentUnitIds.add(unit.id);
      const isSelected = unit.id === selectedRegimentId;
      this.renderUnit(unit, map, isSelected);
    }

    // Remove graphics for units that no longer exist
    for (const [unitId, graphics] of this.unitGraphics.entries()) {
      if (!currentUnitIds.has(unitId)) {
        this.gameLayer.removeChild(graphics);
        this.unitGraphics.delete(unitId);
      }
    }

    // Render order visualizations only during PLANNING phase
    if (gameState.getPhase() === 'PLANNING' && regiments) {
      this.renderOrderVisualizations(regiments, map);
    } else {
      // Clear order visualizations during SIMULATION phase
      this.clearOrderVisualizations();
    }
  }

  /**
   * Render a single unit as a rectangle
   * Only reads from the unit, does not mutate it
   */
  private renderUnit(unit: Unit, map: GameMap, isSelected: boolean = false): void {
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
    // Floor the coordinates to get the tile position since units can have fractional positions during simulation
    let height = 0;
    const tileX = Math.floor(unit.x);
    const tileY = Math.floor(unit.y);
    
    try {
      if (map.isValidPosition(tileX, tileY)) {
        height = map.getTileHeight(tileX, tileY);
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

    // Use different colors for selected vs unselected units
    const fillColor = isSelected ? 0xffff00 : 0xff0000; // Yellow for selected, red for unselected
    
    graphics
      .rect(isoX, isoY, width, unitHeight)
      .fill(fillColor);
    
    // Add a border to selected units for extra visibility
    if (isSelected) {
      graphics
        .rect(isoX, isoY, width, unitHeight)
        .stroke({ width: 2, color: 0xffffff }); // White border
    }
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
   * Render order visualizations for all regiments
   * Only called during PLANNING phase
   */
  private renderOrderVisualizations(regiments: readonly Regiment[], map: GameMap): void {
    // Clear previous visualizations
    this.clearOrderVisualizations();

    for (const regiment of regiments) {
      const order = regiment.getOrder();
      if (!order) {
        continue;
      }

      if (order.type === 'MOVE') {
        this.renderMoveOrderVisualization(regiment, order as MoveOrder, map);
      } else if (order.type === 'HOLD') {
        this.renderHoldOrderVisualization(regiment, map);
      }
    }
  }

  /**
   * Render visualization for a MOVE order
   * Shows an arrow from regiment to target tile and highlights the target
   */
  private renderMoveOrderVisualization(regiment: Regiment, order: MoveOrder, map: GameMap): void {
    const graphics = new Graphics();
    this.orderVisualizationLayer.addChild(graphics);

    // Get regiment position
    const regimentX = regiment.getX();
    const regimentY = regiment.getY();
    let regimentHeight = 0;
    const regimentTileX = Math.floor(regimentX);
    const regimentTileY = Math.floor(regimentY);
    
    if (map.isValidPosition(regimentTileX, regimentTileY)) {
      regimentHeight = map.getTileHeight(regimentTileX, regimentTileY);
    }

    // Get target position
    const targetX = order.targetX;
    const targetY = order.targetY;
    let targetHeight = 0;
    
    if (map.isValidPosition(targetX, targetY)) {
      targetHeight = map.getTileHeight(targetX, targetY);
    }

    // Convert to isometric coordinates
    const regimentIso = gridToIso(regimentX, regimentY, regimentHeight, this.isoConfig);
    const targetIso = gridToIso(targetX, targetY, targetHeight, this.isoConfig);

    // Offset to center of unit (30x30 from renderUnit)
    const startX = regimentIso.isoX + PixiRenderer.UNIT_CENTER_OFFSET_X;
    const startY = regimentIso.isoY + PixiRenderer.UNIT_CENTER_OFFSET_Y;

    // Draw target tile highlight (before arrow so arrow is on top)
    const tileWidth = this.isoConfig.tileWidth;
    const tileHeight = this.isoConfig.tileHeight;
    
    // Draw isometric diamond shape for target tile
    graphics
      .moveTo(targetIso.isoX + tileWidth / 2, targetIso.isoY)
      .lineTo(targetIso.isoX + tileWidth, targetIso.isoY + tileHeight / 2)
      .lineTo(targetIso.isoX + tileWidth / 2, targetIso.isoY + tileHeight)
      .lineTo(targetIso.isoX, targetIso.isoY + tileHeight / 2)
      .lineTo(targetIso.isoX + tileWidth / 2, targetIso.isoY)
      .fill({ color: 0x00ff00, alpha: 0.3 }); // Green highlight with transparency

    // Calculate arrow endpoint (center of target tile)
    const endX = targetIso.isoX + tileWidth / 2;
    const endY = targetIso.isoY + tileHeight / 2;

    // Draw arrow line
    graphics
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({ width: 3, color: 0x00ff00 }); // Green arrow

    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowAngle1 = angle + Math.PI * 0.85;
    const arrowAngle2 = angle - Math.PI * 0.85;

    graphics
      .moveTo(endX, endY)
      .lineTo(endX + PixiRenderer.ARROW_HEAD_SIZE * Math.cos(arrowAngle1), endY + PixiRenderer.ARROW_HEAD_SIZE * Math.sin(arrowAngle1))
      .moveTo(endX, endY)
      .lineTo(endX + PixiRenderer.ARROW_HEAD_SIZE * Math.cos(arrowAngle2), endY + PixiRenderer.ARROW_HEAD_SIZE * Math.sin(arrowAngle2))
      .stroke({ width: 3, color: 0x00ff00 });
  }

  /**
   * Render visualization for a HOLD order
   * Shows a circle indicator around the regiment
   */
  private renderHoldOrderVisualization(regiment: Regiment, map: GameMap): void {
    const graphics = new Graphics();
    this.orderVisualizationLayer.addChild(graphics);

    // Get regiment position
    const regimentX = regiment.getX();
    const regimentY = regiment.getY();
    let regimentHeight = 0;
    const regimentTileX = Math.floor(regimentX);
    const regimentTileY = Math.floor(regimentY);
    
    if (map.isValidPosition(regimentTileX, regimentTileY)) {
      regimentHeight = map.getTileHeight(regimentTileX, regimentTileY);
    }

    // Convert to isometric coordinates
    const regimentIso = gridToIso(regimentX, regimentY, regimentHeight, this.isoConfig);

    // Draw a circle indicator around the regiment (different color for HOLD)
    const centerX = regimentIso.isoX + PixiRenderer.UNIT_CENTER_OFFSET_X;
    const centerY = regimentIso.isoY + PixiRenderer.UNIT_CENTER_OFFSET_Y;

    graphics
      .circle(centerX, centerY, PixiRenderer.HOLD_ORDER_CIRCLE_RADIUS)
      .stroke({ width: 3, color: 0x0000ff }); // Blue circle for HOLD order
  }

  /**
   * Clear all order visualizations
   */
  private clearOrderVisualizations(): void {
    this.orderVisualizationLayer.removeChildren();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clear();
    this.clearOrderVisualizations();
    this.app.stage.removeChild(this.gameLayer);
    this.app.stage.removeChild(this.orderVisualizationLayer);
    this.gameLayer.destroy();
    this.orderVisualizationLayer.destroy();
  }
}
