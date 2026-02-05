import type { Order, MoveOrder } from './Order.ts';
import type { GameMap } from './GameMap.ts';
import { TurnSimulator } from './TurnSimulator.ts';

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
  
  // Movement state for smooth interpolation
  private moveStartX: number | null;
  private moveStartY: number | null;
  private moveTickCount: number;

  constructor(id: string, x: number, y: number, direction: Direction = 'NORTH') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.order = null;
    this.moveStartX = null;
    this.moveStartY = null;
    this.moveTickCount = 0;
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
    // Reset movement state when a new order is assigned
    this.moveStartX = null;
    this.moveStartY = null;
    this.moveTickCount = 0;
  }

  /**
   * Update the regiment's state for one simulation tick
   * This is called during the SIMULATION phase to advance the unit's behavior
   */
  updateTick(): void {
    // Execute current order if any
    if (this.order !== null) {
      if (this.order.type === 'MOVE') {
        this.executeMoveOrder(this.order as MoveOrder);
      }
      // Other order types can be added here in the future
    }
    
    // Additional per-tick logic can be added here:
    // - Combat resolution
    // - Morale updates
    // etc.
  }

  /**
   * Execute a move order over multiple ticks
   * Movement is interpolated to reach the target smoothly over the course of a turn
   * 
   * @param order - The move order to execute
   */
  private executeMoveOrder(order: MoveOrder): void {
    // Initialize movement state on first tick of this order
    if (this.moveStartX === null || this.moveStartY === null) {
      this.moveStartX = this.x;
      this.moveStartY = this.y;
      this.moveTickCount = 0;
      
      // Check if already at target before starting movement
      if (this.moveStartX === order.targetX && this.moveStartY === order.targetY) {
        this.order = null;
        return;
      }
    }
    
    // Increment tick count
    this.moveTickCount++;
    
    // Calculate total distance
    const deltaX = order.targetX - this.moveStartX;
    const deltaY = order.targetY - this.moveStartY;
    
    // Calculate progress (0 to 1)
    const progress = Math.min(this.moveTickCount / TurnSimulator.getTicksPerTurn(), 1.0);
    
    // Calculate new position using linear interpolation
    const newX = this.moveStartX + deltaX * progress;
    const newY = this.moveStartY + deltaY * progress;
    
    // Update position
    this.x = newX;
    this.y = newY;
    
    // Check if we've reached the target (at end of turn)
    if (progress >= 1.0) {
      // Snap to exact target position
      this.x = order.targetX;
      this.y = order.targetY;
      // Clear the order
      this.order = null;
    }
  }

  /**
   * Query the terrain height at the regiment's current position
   * This demonstrates how regiments can query the map for terrain data
   * 
   * @param map - The game map to query
   * @returns The height value at the regiment's position
   * @throws Error if the regiment's position is out of bounds
   * 
   * Note: Callers should ensure the regiment is positioned within map bounds
   * or handle the potential error.
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
