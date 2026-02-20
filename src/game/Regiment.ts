import type { Order, MoveOrder, RotateOrder } from './Order.ts';
import type { GameMap } from './GameMap.ts';
import { TurnSimulator } from './TurnSimulator.ts';

/**
 * Facing direction for a regiment on the battlefield
 */
export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTHEAST' | 'NORTHWEST' | 'SOUTHEAST' | 'SOUTHWEST';

/**
 * Calculate the direction from a delta vector
 * Used to determine which way a regiment should face when moving
 * @param dx - Change in X position
 * @param dy - Change in Y position
 * @returns The direction corresponding to the movement vector
 */
export function calculateDirectionFromDelta(dx: number, dy: number): Direction {
  // Handle zero movement (stay facing current direction)
  if (dx === 0 && dy === 0) {
    return 'NORTH'; // Default direction
  }
  
  // Calculate angle in radians
  const angle = Math.atan2(dy, dx);
  
  // Convert to degrees (0-360)
  let degrees = angle * (180 / Math.PI);
  if (degrees < 0) degrees += 360;
  
  // Map to 8 directions
  // EAST = 0°, SOUTH = 90°, WEST = 180°, NORTH = 270°
  if (degrees >= 337.5 || degrees < 22.5) {
    return 'EAST';
  } else if (degrees >= 22.5 && degrees < 67.5) {
    return 'SOUTHEAST';
  } else if (degrees >= 67.5 && degrees < 112.5) {
    return 'SOUTH';
  } else if (degrees >= 112.5 && degrees < 157.5) {
    return 'SOUTHWEST';
  } else if (degrees >= 157.5 && degrees < 202.5) {
    return 'WEST';
  } else if (degrees >= 202.5 && degrees < 247.5) {
    return 'NORTHWEST';
  } else if (degrees >= 247.5 && degrees < 292.5) {
    return 'NORTH';
  } else { // degrees >= 292.5 && degrees < 337.5
    return 'NORTHEAST';
  }
}

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
      } else if (this.order.type === 'ROTATE') {
        // ROTATE order: direction already set when order was created, just clear it
        this.order = null;
      } else if (this.order.type === 'HOLD') {
        // HOLD order: regiment stays in place, no action needed
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
      
      // Update direction to face the movement direction
      const deltaX = order.targetX - this.moveStartX;
      const deltaY = order.targetY - this.moveStartY;
      this.direction = calculateDirectionFromDelta(deltaX, deltaY);
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
