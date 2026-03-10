import type { Order } from './Order.ts';
import type { GameMap } from './GameMap.ts';
import { TurnSimulator } from './TurnSimulator.ts';

/**
 * Facing direction for a regiment on the battlefield
 */
export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTHEAST' | 'NORTHWEST' | 'SOUTHEAST' | 'SOUTHWEST';

/**
 * Represents the current simulation state of a regiment.
 * This is the single source of truth for the regiment's position and orientation.
 */
export interface RegimentState {
  x: number;
  y: number;
  direction: Direction;
}

/**
 * Used for smooth movement interpolation during simulation.
 * This state does not affect game logic and exists only to support rendering interpolation.
 */
export interface MovementState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  tickProgress: number;
}

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
  static readonly MAX_ORDERS = 3;
  static readonly MAX_MOVEMENT_RANGE = 3; // Maximum Chebyshev distance a regiment can move per turn
  static readonly DEFAULT_UNIT_COUNT = 120;
  static readonly DEFAULT_SHOOTING_RANGE = 3;
  static readonly DEFAULT_SHOOTING_ACCURACY = 0.6;
  static readonly DEFAULT_MORALE = 100;

  private id: string;

  // Current state of the regiment
  private state: RegimentState;

  // Queue of issued orders (executed in sequence, max MAX_ORDERS)
  private orders: Order[];

  // Movement interpolation state (only active during simulation)
  private movement: MovementState | null;

  // Combat attributes
  private unitCount: number;
  private shootingRange: number;
  private shootingAccuracy: number;
  private morale: number;

  constructor(id: string, x: number, y: number, direction: Direction = 'NORTH') {
    this.id = id;
    this.state = { x, y, direction };
    this.orders = [];
    this.movement = null;
    this.unitCount = Regiment.DEFAULT_UNIT_COUNT;
    this.shootingRange = Regiment.DEFAULT_SHOOTING_RANGE;
    this.shootingAccuracy = Regiment.DEFAULT_SHOOTING_ACCURACY;
    this.morale = Regiment.DEFAULT_MORALE;
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
    return this.state.x;
  }

  /**
   * Get the current Y position on the grid
   */
  getY(): number {
    return this.state.y;
  }

  /**
   * Get the facing direction
   */
  getDirection(): Direction {
    return this.state.direction;
  }

  /**
   * Get the current regiment state (position and direction)
   */
  getState(): RegimentState {
    return this.state;
  }

  /**
   * Get the current movement interpolation state (null if not moving)
   */
  getMovement(): MovementState | null {
    return this.movement;
  }

  /**
   * Get the number of soldiers currently in the regiment
   */
  getUnitCount(): number {
    return this.unitCount;
  }

  /**
   * Get the maximum shooting range (in map tiles)
   */
  getShootingRange(): number {
    return this.shootingRange;
  }

  /**
   * Get the base shooting accuracy modifier (0–1)
   */
  getShootingAccuracy(): number {
    return this.shootingAccuracy;
  }

  /**
   * Get the current morale value (0–100)
   */
  getMorale(): number {
    return this.morale;
  }

  /**
   * Get the current order (first in queue), or null if no orders
   */
  getOrder(): Order | null {
    return this.orders[0] ?? null;
  }

  /**
   * Get all orders in the queue (read-only)
   */
  getOrders(): readonly Order[] {
    return this.orders;
  }

  /**
   * Set the grid position
   */
  setPosition(x: number, y: number): void {
    this.state.x = x;
    this.state.y = y;
  }

  /**
   * Set the facing direction
   */
  setDirection(direction: Direction): void {
    this.state.direction = direction;
  }

  /**
   * Replace the entire order queue with a single order (or clear it if null).
   * Resets movement interpolation state.
   */
  setOrder(order: Order | null): void {
    this.orders = order ? [order] : [];
    // Reset movement interpolation state when orders change
    this.movement = null;
  }

  /**
   * Add an order to the end of the queue.
   * Returns true if successful, false if the queue is already full (max MAX_ORDERS).
   */
  addOrder(order: Order): boolean {
    if (this.orders.length >= Regiment.MAX_ORDERS) {
      return false;
    }
    this.orders.push(order);
    return true;
  }

  /**
   * Remove the order at the given index from the queue.
   * If the current (first) order is removed, movement interpolation is reset.
   */
  removeOrder(index: number): void {
    if (index < 0 || index >= this.orders.length) {
      return;
    }
    this.orders.splice(index, 1);
    if (index === 0) {
      this.movement = null;
    }
  }

  /**
   * Move the order at the given index one position earlier in the queue.
   * If the resulting first order changes, movement interpolation is reset.
   */
  moveOrderUp(index: number): void {
    if (index <= 0 || index >= this.orders.length) {
      return;
    }
    [this.orders[index - 1], this.orders[index]] = [this.orders[index], this.orders[index - 1]];
    if (index === 1) {
      this.movement = null;
    }
  }

  /**
   * Move the order at the given index one position later in the queue.
   * If the current first order changes, movement interpolation is reset.
   */
  moveOrderDown(index: number): void {
    if (index < 0 || index >= this.orders.length - 1) {
      return;
    }
    [this.orders[index], this.orders[index + 1]] = [this.orders[index + 1], this.orders[index]];
    if (index === 0) {
      this.movement = null;
    }
  }

  /**
   * Update the regiment's state for one simulation tick
   * This is called during the SIMULATION phase to advance the unit's behavior
   */
  updateTick(): void {
    // Execute current order (first in queue) if any
    if (this.orders.length > 0) {
      const currentOrder = this.orders[0];
      if (currentOrder.type === 'MOVE') {
        this.executeMoveOrder(currentOrder);
      } else if (currentOrder.type === 'ROTATE') {
        // ROTATE order: apply target direction from order and advance queue
        this.state.direction = currentOrder.targetState.direction;
        this.orders.shift();
      } else if (currentOrder.type === 'HOLD') {
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
   * Movement is interpolated from state to order.targetState smoothly over the course of a turn
   * 
   * @param order - The order to execute (must be type 'MOVE')
   */
  private executeMoveOrder(order: Order): void {
    // Initialize movement interpolation state on first tick of this order
    if (this.movement === null) {
      this.movement = {
        startX: this.state.x,
        startY: this.state.y,
        endX: order.targetState.x,
        endY: order.targetState.y,
        tickProgress: 0
      };

      // Check if already at target before starting movement
      if (this.movement.startX === order.targetState.x && this.movement.startY === order.targetState.y) {
        this.orders.shift();
        this.movement = null;
        return;
      }

      // Update direction to face the movement direction
      this.state.direction = order.targetState.direction;
    }
    
    // Increment tick progress
    this.movement.tickProgress++;
    
    // Calculate progress (0 to 1)
    const progress = Math.min(this.movement.tickProgress / TurnSimulator.getTicksPerTurn(), 1.0);
    
    // Calculate new position using linear interpolation
    const deltaX = this.movement.endX - this.movement.startX;
    const deltaY = this.movement.endY - this.movement.startY;
    this.state.x = this.movement.startX + deltaX * progress;
    this.state.y = this.movement.startY + deltaY * progress;
    
    // Check if we've reached the target (at end of turn)
    if (progress >= 1.0) {
      // Snap to exact target position
      this.state.x = this.movement.endX;
      this.state.y = this.movement.endY;
      // Advance to the next order in the queue
      this.orders.shift();
      this.movement = null;
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
    return map.getTileHeight(this.state.x, this.state.y);
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
