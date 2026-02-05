import type { Order } from './Order.ts';
import type { GameMap } from './GameMap.ts';

/**
 * Facing direction for a regiment on the battlefield
 */
export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTHEAST' | 'NORTHWEST' | 'SOUTHEAST' | 'SOUTHWEST';

/**
 * Regiment class represents a single unit on the battlefield.
 * 
 * Design rules:
 * - No dependencies on rendering or UI
 * - Pure game logic only
 * - Can update its state per simulation tick
 */
export class Regiment {
  private id: string;
  private x: number;
  private y: number;
  private direction: Direction;
  private order: Order | null;

  constructor(id: string, x: number, y: number, direction: Direction = 'NORTH') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.order = null;
  }

  /**
   * Get the unique identifier of this regiment
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get the current X position on the grid
   */
  getX(): number {
    return this.x;
  }

  /**
   * Get the current Y position on the grid
   */
  getY(): number {
    return this.y;
  }

  /**
   * Get the facing direction
   */
  getDirection(): Direction {
    return this.direction;
  }

  /**
   * Get the current order (if any)
   */
  getOrder(): Order | null {
    return this.order;
  }

  /**
   * Set the grid position
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Set the facing direction
   */
  setDirection(direction: Direction): void {
    this.direction = direction;
  }

  /**
   * Assign an order to this regiment
   */
  setOrder(order: Order | null): void {
    this.order = order;
  }

  /**
   * Update the regiment's state for one simulation tick
   * This is called during the SIMULATION phase to advance the unit's behavior
   */
  updateTick(): void {
    // Execute current order if any
    if (this.order !== null) {
      // Order execution logic will be implemented when specific order types are defined
      // For now, this is a placeholder for the simulation tick update
    }
    
    // Additional per-tick logic can be added here:
    // - Movement processing
    // - Combat resolution
    // - Morale updates
    // etc.
  }

  /**
   * Query the terrain height at the regiment's current position
   * This demonstrates how regiments can query the map for terrain data
   * 
   * @param map - The game map to query
   * @returns The height value at the regiment's position
   */
  queryTerrainHeight(map: GameMap): number {
    return map.getTileHeight(this.x, this.y);
  }

  /**
   * Check if a position is valid on the map
   * This can be used for pathfinding and movement validation
   * 
   * @param map - The game map to query
   * @param x - The x coordinate to check
   * @param y - The y coordinate to check
   * @returns True if the position is valid on the map
   */
  canMoveTo(map: GameMap, x: number, y: number): boolean {
    return map.isValidPosition(x, y);
  }
}
