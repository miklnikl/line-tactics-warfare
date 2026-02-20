import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { GameState } from '../game/GameState.ts';
import type { GameMap } from '../game/GameMap.ts';
import type { Unit } from '../game/Unit.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { MoveOrder } from '../game/Order.ts';
import type { Direction } from '../game/Regiment.ts';
import { gridToIso, isoToGrid, type IsoConfig, DEFAULT_ISO_CONFIG } from '../utils/iso.ts';

/**
 * PixiRenderer is responsible for drawing the current GameState using PixiJS.
 * 
 * Design rules:
 * - Does NOT mutate game state
 * - Only READS from GameState
 * - Manages PixiJS stage and layers
 * - Renders regiments with directional sprites
 */
export class PixiRenderer {
  private app: Application;
  private mapLayer: Container;
  private gameLayer: Container;
  private unitGraphics: Map<string, Graphics>;
  private unitSprites: Map<string, Sprite>;
  private orderVisualizationLayer: Container;
  private hoverLayer: Container;
  private isoConfig: IsoConfig;
  private mapGraphics: Graphics | null;
  private hoveredTile: { x: number; y: number } | null;
  
  // Sprite textures for regiment rendering (4 cardinal directions)
  private regimentNorthTexture: Texture | null = null;
  private regimentSouthTexture: Texture | null = null;
  private regimentEastTexture: Texture | null = null;
  private regimentWestTexture: Texture | null = null;
  private spritesLoaded: boolean = false;
  
  // Camera offset for panning
  private cameraOffsetX: number = 0;
  private cameraOffsetY: number = 0;
  private initialOffsetX: number = 0;
  private initialOffsetY: number = 0;
  
  // Keyboard state for smooth scrolling
  private keysPressed: Set<string> = new Set();
  private static readonly SCROLL_SPEED = 5; // pixels per frame

  // Visual constants for order visualization
  private static readonly UNIT_CENTER_OFFSET_X = 32; // Half of tile width (64/2)
  private static readonly UNIT_CENTER_OFFSET_Y = 16; // Half of tile height (32/2)
  private static readonly ARROW_HEAD_SIZE = 10;

  // Visual constants for selection
  private static readonly SELECTION_STROKE_WIDTH = 2;
  private static readonly SELECTION_COLOR = 0xffff00; // Yellow

  // Visual constants for tiles
  private static readonly GRASS_COLOR = 0x85EC0D; // #85EC0D
  private static readonly TILE_BORDER_COLOR = 0xB9FF6C; // #B9FF6C
  private static readonly TILE_HOVER_COLOR = 0xFFFFFF; // White highlight
  private static readonly WALL_LEFT_COLOR = 0x5D4E37; // Dark brown/mud for left wall
  private static readonly WALL_RIGHT_COLOR = 0x8B7355; // Lighter brown/soil for right wall
  private static readonly WALL_FRONT_LEFT_COLOR = 0x6B5842; // Medium-dark brown for front-left wall
  private static readonly WALL_FRONT_RIGHT_COLOR = 0x7A6550; // Medium-light brown for front-right wall

  constructor(app: Application, isoConfig: IsoConfig = DEFAULT_ISO_CONFIG) {
    this.app = app;
    this.mapLayer = new Container();
    this.gameLayer = new Container();
    this.unitGraphics = new Map();
    this.unitSprites = new Map();
    this.orderVisualizationLayer = new Container();
    this.hoverLayer = new Container();
    this.isoConfig = isoConfig;
    this.mapGraphics = null;
    this.hoveredTile = null;
    
    // Add layers to the stage in order (bottom to top)
    this.app.stage.addChild(this.mapLayer);
    this.app.stage.addChild(this.gameLayer);
    this.app.stage.addChild(this.orderVisualizationLayer);
    this.app.stage.addChild(this.hoverLayer);
    
    // Load sprite textures
    this.loadSprites();
    
    // Set up mouse move listener for hover effect
    this.setupHoverListener();
    
    // Set up keyboard listeners for camera panning
    this.setupKeyboardListeners();
  }

  /**
   * Load sprite textures asynchronously
   * Sprites are loaded from the public/assets folder
   */
  private async loadSprites(): Promise<void> {
    try {
      // Use Assets API for PixiJS v8
      // Load 4 cardinal direction sprites
      this.regimentNorthTexture = await Assets.load('/assets/regiment-nord.png');
      this.regimentSouthTexture = await Assets.load('/assets/regiment-south.png');
      this.regimentEastTexture = await Assets.load('/assets/regiment-east.png');
      this.regimentWestTexture = await Assets.load('/assets/regiment-west.png');
      
      // Textures from Assets.load are ready to use immediately after the promise resolves
      this.spritesLoaded = true;
      console.log('Regiment sprites loaded successfully');
    } catch (error) {
      console.error('Failed to load regiment sprites:', error);
      this.spritesLoaded = false;
    }
  }

  /**
   * Calculate the bounds of an isometric map and return centering offset
   * @param mapWidth - Width of the map in grid tiles
   * @param mapHeight - Height of the map in grid tiles
   * @returns Object with offsetX and offsetY to center the map
   */
  private calculateMapCenterOffset(mapWidth: number, mapHeight: number): { offsetX: number; offsetY: number } {
    const { tileWidth, tileHeight } = this.isoConfig;
    
    // Calculate the corners of the isometric map in screen space
    // Top corner: grid (0, 0)
    const topCorner = gridToIso(0, 0, 0, this.isoConfig);
    
    // Right corner: grid (mapWidth - 1, 0)
    const rightCorner = gridToIso(mapWidth - 1, 0, 0, this.isoConfig);
    
    // Bottom corner: grid (mapWidth - 1, mapHeight - 1)
    const bottomCorner = gridToIso(mapWidth - 1, mapHeight - 1, 0, this.isoConfig);
    
    // Left corner: grid (0, mapHeight - 1)
    const leftCorner = gridToIso(0, mapHeight - 1, 0, this.isoConfig);
    
    // Calculate bounds (accounting for tile dimensions)
    const minX = leftCorner.isoX - tileWidth / 2;
    const maxX = rightCorner.isoX + tileWidth / 2;
    const minY = topCorner.isoY;
    const maxY = bottomCorner.isoY + tileHeight;
    
    const mapWidthPixels = maxX - minX;
    const mapHeightPixels = maxY - minY;
    
    // Calculate offset to center the map in the viewport
    const offsetX = (this.app.screen.width - mapWidthPixels) / 2 - minX;
    const offsetY = (this.app.screen.height - mapHeightPixels) / 2 - minY;
    
    return { offsetX, offsetY };
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

    // Create a map of unit ID to regiment for quick lookup
    // Note: Rebuilt each frame rather than cached. This is acceptable because:
    // 1. Regiment count is typically small (3-30)
    // 2. Map construction is O(n) and very fast
    // 3. Avoids complex cache invalidation when regiments change
    const regimentMap = new Map<string, Regiment>();
    if (regiments) {
      for (const regiment of regiments) {
        regimentMap.set(regiment.getId(), regiment);
      }
    }

    // Render the map tiles (only once or when map changes)
    this.renderMap(map);

    // Render hover effect with map bounds checking
    this.renderHoverEffect(map);

    // Update or create graphics for each unit
    for (const unit of units) {
      currentUnitIds.add(unit.id);
      const isSelected = unit.id === selectedRegimentId;
      const regiment = regimentMap.get(unit.id);
      this.renderUnit(unit, map, isSelected, regiment);
    }

    // Remove graphics and sprites for units that no longer exist
    for (const [unitId, graphics] of this.unitGraphics.entries()) {
      if (!currentUnitIds.has(unitId)) {
        this.gameLayer.removeChild(graphics);
        this.unitGraphics.delete(unitId);
      }
    }
    for (const [unitId, sprite] of this.unitSprites.entries()) {
      if (!currentUnitIds.has(unitId)) {
        this.gameLayer.removeChild(sprite);
        this.unitSprites.delete(unitId);
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
   * Render a single unit with sprite based on regiment direction
   * Only reads from the unit, does not mutate it
   */
  private renderUnit(unit: Unit, map: GameMap, isSelected: boolean = false, regiment?: Regiment): void {
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
    
    // Use sprite rendering if sprites are loaded, otherwise fallback to diamond
    if (this.spritesLoaded && regiment && this.regimentNorthTexture && this.regimentSouthTexture && this.regimentEastTexture && this.regimentWestTexture) {
      this.renderUnitSprite(unit, isoX, isoY, isSelected, regiment);
    } else {
      this.renderUnitDiamond(unit, isoX, isoY, isSelected);
    }
  }

  /**
   * Render unit using sprite based on direction
   */
  private renderUnitSprite(unit: Unit, isoX: number, isoY: number, isSelected: boolean, regiment: Regiment): void {
    let sprite = this.unitSprites.get(unit.id);

    if (!sprite) {
      // Create new sprite for this unit
      sprite = new Sprite();
      this.gameLayer.addChild(sprite);
      this.unitSprites.set(unit.id, sprite);
    }

    // Determine which texture to use based on direction
    const direction = regiment.getDirection();
    const texture = this.getTextureForDirection(direction);
    
    if (texture) {
      sprite.texture = texture;
    }

    // Position sprite at the center of the tile
    const tileWidth = this.isoConfig.tileWidth;
    const tileHeight = this.isoConfig.tileHeight;
    
    // Center the sprite on the tile
    sprite.x = isoX + tileWidth / 2;
    sprite.y = isoY + tileHeight / 2;
    sprite.anchor.set(0.5, 0.5);

    // Add selection indicator using graphics overlay
    if (isSelected) {
      let graphics = this.unitGraphics.get(unit.id);
      
      if (!graphics) {
        graphics = new Graphics();
        this.gameLayer.addChild(graphics);
        this.unitGraphics.set(unit.id, graphics);
      }
      
      graphics.clear();
      
      // Draw a selection diamond around the sprite
      const diamondIsoX = sprite.x - tileWidth / 2;
      const diamondIsoY = sprite.y - tileHeight / 2;
      this.drawIsoDiamond(graphics, diamondIsoX, diamondIsoY, tileWidth, tileHeight);
      graphics.stroke({ width: PixiRenderer.SELECTION_STROKE_WIDTH, color: PixiRenderer.SELECTION_COLOR });
    } else {
      // Clear graphics if not selected
      const graphics = this.unitGraphics.get(unit.id);
      if (graphics) {
        graphics.clear();
      }
    }
  }

  /**
   * Fallback: Render unit as diamond shape (used when sprites not loaded)
   */
  private renderUnitDiamond(unit: Unit, isoX: number, isoY: number, isSelected: boolean): void {
    let graphics = this.unitGraphics.get(unit.id);

    if (!graphics) {
      // Create new graphics for this unit
      graphics = new Graphics();
      this.gameLayer.addChild(graphics);
      this.unitGraphics.set(unit.id, graphics);
    }

    // Clear previous drawing
    graphics.clear();
    
    const tileWidth = this.isoConfig.tileWidth;
    const tileHeight = this.isoConfig.tileHeight;

    // Use different colors for selected vs unselected units
    const fillColor = isSelected ? 0xffff00 : 0xff0000; // Yellow for selected, red for unselected
    
    // Draw isometric diamond for the regiment
    this.drawIsoDiamond(graphics, isoX, isoY, tileWidth, tileHeight);
    graphics.fill(fillColor);
    
    // Add a border to selected units for extra visibility
    if (isSelected) {
      this.drawIsoDiamond(graphics, isoX, isoY, tileWidth, tileHeight);
      graphics.stroke({ width: 2, color: 0xffffff }); // White border
    }
  }

  /**
   * Get the appropriate texture based on regiment direction
   * Maps 8 directions to left/right facing sprites
   */
  private getTextureForDirection(direction: Direction): Texture | null {
    // Map 8 directions to 4 cardinal direction sprites
    switch (direction) {
      case 'NORTH':
      case 'NORTHWEST':
        return this.regimentNorthTexture;
      case 'SOUTH':
      case 'SOUTHEAST':
        return this.regimentSouthTexture;
      case 'EAST':
      case 'NORTHEAST':
        return this.regimentEastTexture;
      case 'WEST':
      case 'SOUTHWEST':
      default:
        return this.regimentWestTexture;
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
    
    for (const sprite of this.unitSprites.values()) {
      this.gameLayer.removeChild(sprite);
    }
    this.unitSprites.clear();
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
    * Shows a diamond indicator around the regiment
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

    // Draw a grey diamond indicator around the regiment for HOLD
    const centerX = regimentIso.isoX + PixiRenderer.UNIT_CENTER_OFFSET_X;
    const centerY = regimentIso.isoY + PixiRenderer.UNIT_CENTER_OFFSET_Y;
    const tileWidth = this.isoConfig.tileWidth;
    const tileHeight = this.isoConfig.tileHeight;
    const diamondIsoX = centerX - tileWidth / 2;
    const diamondIsoY = centerY - tileHeight / 2;

    this.drawIsoDiamond(graphics, diamondIsoX, diamondIsoY, tileWidth, tileHeight);
    graphics.stroke({ width: 3, color: 0x808080 }); // Grey diamond for HOLD order
  }

  /**
   * Clear all order visualizations
   */
  private clearOrderVisualizations(): void {
    this.orderVisualizationLayer.removeChildren();
  }

  /**
   * Render the map tiles as an isometric grid
   */
  private renderMap(map: GameMap): void {
    // Only render once if not already rendered
    if (this.mapGraphics) {
      return;
    }

    this.mapGraphics = new Graphics();
    this.mapLayer.addChild(this.mapGraphics);

    const mapWidth = map.getWidth();
    const mapHeight = map.getHeight();
    const tileWidth = this.isoConfig.tileWidth;
    const tileHeight = this.isoConfig.tileHeight;

    // Calculate and apply centering offset
    const { offsetX, offsetY } = this.calculateMapCenterOffset(mapWidth, mapHeight);
    this.initialOffsetX = offsetX;
    this.initialOffsetY = offsetY;
    this.updateLayerPositions();

    // Render each tile
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const height = map.getTileHeight(x, y);
        const { isoX, isoY } = gridToIso(x, y, height, this.isoConfig);

        // Draw walls for elevated tiles
        if (height > 0) {
          // Check neighboring tiles to determine which walls to draw
          const leftNeighborHeight = map.isValidPosition(x - 1, y) ? map.getTileHeight(x - 1, y) : 0;
          const rightNeighborHeight = map.isValidPosition(x + 1, y) ? map.getTileHeight(x + 1, y) : 0;
          const frontLeftNeighborHeight = map.isValidPosition(x - 1, y + 1) ? map.getTileHeight(x - 1, y + 1) : 0;
          const frontRightNeighborHeight = map.isValidPosition(x + 1, y + 1) ? map.getTileHeight(x + 1, y + 1) : 0;
          
          this.drawTileWalls(this.mapGraphics, isoX, isoY, tileWidth, tileHeight, height, leftNeighborHeight, rightNeighborHeight, frontLeftNeighborHeight, frontRightNeighborHeight);
        }

        // Draw isometric diamond tile with grass color
        this.drawIsoDiamond(this.mapGraphics, isoX, isoY, tileWidth, tileHeight);
        this.mapGraphics.fill(PixiRenderer.GRASS_COLOR);

        // Draw tile border
        this.drawIsoDiamond(this.mapGraphics, isoX, isoY, tileWidth, tileHeight);
        this.mapGraphics.stroke({ width: 1, color: PixiRenderer.TILE_BORDER_COLOR });
      }
    }
  }

  /**
   * Set up hover listener for tile hover effect
   */
  private setupHoverListener(): void {
    this.app.canvas.addEventListener('mousemove', this.handleMouseMove);
  }

  /**
   * Set up keyboard listeners for camera panning
   */
  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Handle keydown events for camera panning
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    
    // Arrow keys or WASD for panning
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      this.keysPressed.add(key);
      event.preventDefault(); // Prevent page scrolling
    }
  };

  /**
   * Handle keyup events for camera panning
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.keysPressed.delete(key);
  };

  /**
   * Update camera position based on currently pressed keys
   * This should be called every frame
   */
  updateCamera(): void {
    let deltaX = 0;
    let deltaY = 0;

    // Check which keys are pressed and accumulate movement
    if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
      deltaX += PixiRenderer.SCROLL_SPEED;
    }
    if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
      deltaX -= PixiRenderer.SCROLL_SPEED;
    }
    if (this.keysPressed.has('arrowup') || this.keysPressed.has('w')) {
      deltaY += PixiRenderer.SCROLL_SPEED;
    }
    if (this.keysPressed.has('arrowdown') || this.keysPressed.has('s')) {
      deltaY -= PixiRenderer.SCROLL_SPEED;
    }

    // Update camera offset
    if (deltaX !== 0 || deltaY !== 0) {
      this.cameraOffsetX += deltaX;
      this.cameraOffsetY += deltaY;
      this.updateLayerPositions();
    }
  }

  /**
   * Update all layer positions based on camera offset
   */
  private updateLayerPositions(): void {
    const totalOffsetX = this.initialOffsetX + this.cameraOffsetX;
    const totalOffsetY = this.initialOffsetY + this.cameraOffsetY;
    
    this.mapLayer.x = totalOffsetX;
    this.mapLayer.y = totalOffsetY;
    this.gameLayer.x = totalOffsetX;
    this.gameLayer.y = totalOffsetY;
    this.orderVisualizationLayer.x = totalOffsetX;
    this.orderVisualizationLayer.y = totalOffsetY;
    this.hoverLayer.x = totalOffsetX;
    this.hoverLayer.y = totalOffsetY;
  }

  /**
   * Handle mouse move for tile hover effect
   */
  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.app.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Convert screen coordinates to grid coordinates (accounts for centering offset)
    const { gridX, gridY } = this.screenToGrid(canvasX, canvasY);
    
    // Use Math.round() for isometric tiles to get the nearest tile center
    // This provides better accuracy for isometric projection
    const tileX = Math.round(gridX);
    const tileY = Math.round(gridY);

    // Update hovered tile only if it changed
    if (!this.hoveredTile || this.hoveredTile.x !== tileX || this.hoveredTile.y !== tileY) {
      this.hoveredTile = { x: tileX, y: tileY };
    }
  };

  /**
   * Helper method to draw an isometric diamond shape
   */
  private drawIsoDiamond(graphics: Graphics, isoX: number, isoY: number, tileWidth: number, tileHeight: number): void {
    graphics
      .moveTo(isoX + tileWidth / 2, isoY)
      .lineTo(isoX + tileWidth, isoY + tileHeight / 2)
      .lineTo(isoX + tileWidth / 2, isoY + tileHeight)
      .lineTo(isoX, isoY + tileHeight / 2)
      .lineTo(isoX + tileWidth / 2, isoY);
  }

  /**
   * Draw walls for elevated tiles
   * Draws the left, right, and front faces of an elevated isometric tile
   * Only draws walls that are visible (not blocked by equal or higher neighbors)
   */
  private drawTileWalls(
    graphics: Graphics,
    isoX: number,
    isoY: number,
    tileWidth: number,
    tileHeight: number,
    height: number,
    leftNeighborHeight: number,
    rightNeighborHeight: number,
    frontLeftNeighborHeight: number,
    frontRightNeighborHeight: number
  ): void {
    // Draw left wall only if this tile is higher than its left neighbor
    if (height > leftNeighborHeight) {
      const wallHeight = height - leftNeighborHeight;
      graphics
        .moveTo(isoX, isoY + tileHeight / 2 + wallHeight) // Bottom-left at neighbor level
        .lineTo(isoX, isoY + tileHeight / 2) // Top-left at this tile's level
        .lineTo(isoX + tileWidth / 2, isoY) // Top point of diamond
        .lineTo(isoX + tileWidth / 2, isoY + wallHeight) // Top point at neighbor level
        .lineTo(isoX, isoY + tileHeight / 2 + wallHeight)
        .fill(PixiRenderer.WALL_LEFT_COLOR);
    }

    // Draw right wall only if this tile is higher than its right neighbor
    if (height > rightNeighborHeight) {
      const wallHeight = height - rightNeighborHeight;
      graphics
        .moveTo(isoX + tileWidth, isoY + tileHeight / 2 + wallHeight) // Bottom-right at neighbor level
        .lineTo(isoX + tileWidth, isoY + tileHeight / 2) // Top-right at this tile's level
        .lineTo(isoX + tileWidth / 2, isoY) // Top point of diamond
        .lineTo(isoX + tileWidth / 2, isoY + wallHeight) // Top point at neighbor level
        .lineTo(isoX + tileWidth, isoY + tileHeight / 2 + wallHeight)
        .fill(PixiRenderer.WALL_RIGHT_COLOR);
    }

    // Draw front-left wall only if this tile is higher than its front-left diagonal neighbor
    // Wall from left point to bottom point
    if (height > frontLeftNeighborHeight) {
      const wallHeight = height - frontLeftNeighborHeight;
      graphics
        .moveTo(isoX, isoY + tileHeight / 2 + wallHeight) // Left point at neighbor level
        .lineTo(isoX, isoY + tileHeight / 2) // Left point at this tile's level
        .lineTo(isoX + tileWidth / 2, isoY + tileHeight) // Bottom point at this tile's level
        .lineTo(isoX + tileWidth / 2, isoY + tileHeight + wallHeight) // Bottom point at neighbor level
        .lineTo(isoX, isoY + tileHeight / 2 + wallHeight)
        .fill(PixiRenderer.WALL_FRONT_LEFT_COLOR);
    }

    // Draw front-right wall only if this tile is higher than its front-right diagonal neighbor
    // Wall from bottom point to right point
    if (height > frontRightNeighborHeight) {
      const wallHeight = height - frontRightNeighborHeight;
      graphics
        .moveTo(isoX + tileWidth / 2, isoY + tileHeight + wallHeight) // Bottom point at neighbor level
        .lineTo(isoX + tileWidth / 2, isoY + tileHeight) // Bottom point at this tile's level
        .lineTo(isoX + tileWidth, isoY + tileHeight / 2) // Right point at this tile's level
        .lineTo(isoX + tileWidth, isoY + tileHeight / 2 + wallHeight) // Right point at neighbor level
        .lineTo(isoX + tileWidth / 2, isoY + tileHeight + wallHeight)
        .fill(PixiRenderer.WALL_FRONT_RIGHT_COLOR);
    }
  }

  /**
   * Convert canvas screen coordinates to grid coordinates
   * This accounts for the map centering offset and tile center offset
   * 
   * @param canvasX - X coordinate relative to canvas
   * @param canvasY - Y coordinate relative to canvas
   * @returns Grid coordinates as { gridX, gridY }
   */
  screenToGrid(canvasX: number, canvasY: number): { gridX: number; gridY: number } {
    const { tileWidth, tileHeight } = this.isoConfig;
    
    // Adjust for the layer offset (centering)
    let adjustedX = canvasX - this.mapLayer.x;
    let adjustedY = canvasY - this.mapLayer.y;
    
    // Adjust for the tile center offset
    // The diamond is drawn with its top point at (isoX + tileWidth/2, isoY)
    // and its center at (isoX + tileWidth/2, isoY + tileHeight/2)
    // We need to offset to the tile's origin for accurate conversion
    adjustedX -= tileWidth / 2;
    adjustedY -= tileHeight / 2;

    // Convert to grid coordinates
    return isoToGrid(adjustedX, adjustedY, this.isoConfig);
  }

  /**
   * Render the hover effect for the currently hovered tile
   */
  private renderHoverEffect(map: GameMap): void {
    // Clear previous hover graphics
    this.hoverLayer.removeChildren();

    if (!this.hoveredTile) {
      return;
    }

    const { x, y } = this.hoveredTile;
    
    // Only render hover if within map bounds
    if (!map.isValidPosition(x, y)) {
      return;
    }

    const tileWidth = this.isoConfig.tileWidth;
    const tileHeight = this.isoConfig.tileHeight;
    const height = map.getTileHeight(x, y);
    const { isoX, isoY } = gridToIso(x, y, height, this.isoConfig);

    const hoverGraphics = new Graphics();
    this.hoverLayer.addChild(hoverGraphics);

    // Draw hover highlight as a semi-transparent white overlay
    this.drawIsoDiamond(hoverGraphics, isoX, isoY, tileWidth, tileHeight);
    hoverGraphics.fill({ color: PixiRenderer.TILE_HOVER_COLOR, alpha: 0.2 });

    // Draw thicker border for hover
    this.drawIsoDiamond(hoverGraphics, isoX, isoY, tileWidth, tileHeight);
    hoverGraphics.stroke({ width: 2, color: PixiRenderer.TILE_HOVER_COLOR, alpha: 0.6 });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clear();
    this.clearOrderVisualizations();
    this.app.canvas.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.app.stage.removeChild(this.mapLayer);
    this.app.stage.removeChild(this.gameLayer);
    this.app.stage.removeChild(this.orderVisualizationLayer);
    this.app.stage.removeChild(this.hoverLayer);
    this.mapLayer.destroy();
    this.gameLayer.destroy();
    this.orderVisualizationLayer.destroy();
    this.hoverLayer.destroy();
  }
}
