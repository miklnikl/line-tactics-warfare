/**
 * GameMap represents the logical battlefield grid with terrain height data.
 * 
 * Design rules:
 * - No dependencies on rendering or UI
 * - Pure game logic only
 * - Stores terrain height data for each tile
 * - Can be queried by regiments for pathfinding and line-of-sight
 */
export class GameMap {
  private width: number;
  private height: number;
  private tileHeights: number[][];

  /**
   * Create a new GameMap with the specified dimensions
   * 
   * @param width - The width of the map in tiles
   * @param height - The height of the map in tiles
   * @param defaultHeight - Default height for all tiles (default: 0)
   */
  constructor(width: number, height: number, defaultHeight: number = 0) {
    if (width <= 0 || height <= 0) {
      throw new Error('Map dimensions must be positive');
    }

    this.width = width;
    this.height = height;
    
    // Initialize the 2D array with default height values
    this.tileHeights = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => defaultHeight)
    );
  }

  /**
   * Get the width of the map in tiles
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Get the height of the map in tiles
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * Get the height value of a tile at the specified position
   * 
   * @param x - The x coordinate (column)
   * @param y - The y coordinate (row)
   * @returns The height value at the specified position
   * @throws Error if coordinates are out of bounds
   */
  getTileHeight(x: number, y: number): number {
    if (!this.isValidPosition(x, y)) {
      throw new Error(`Position (${x}, ${y}) is out of bounds`);
    }
    
    return this.tileHeights[y][x];
  }

  /**
   * Set the height value of a tile at the specified position
   * 
   * @param x - The x coordinate (column)
   * @param y - The y coordinate (row)
   * @param height - The new height value for the tile
   * @throws Error if coordinates are out of bounds
   */
  setTileHeight(x: number, y: number, height: number): void {
    if (!this.isValidPosition(x, y)) {
      throw new Error(`Position (${x}, ${y}) is out of bounds`);
    }
    
    this.tileHeights[y][x] = height;
  }

  /**
   * Check if a position is within the map bounds
   * This can be used by regiments for boundary checking
   * 
   * @param x - The x coordinate (column)
   * @param y - The y coordinate (row)
   * @returns True if the position is valid, false otherwise
   */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get a copy of all tile heights
   * Returns a deep copy to prevent external mutation
   * 
   * @returns A 2D array of height values
   */
  getAllTileHeights(): number[][] {
    return this.tileHeights.map(row => [...row]);
  }
}
