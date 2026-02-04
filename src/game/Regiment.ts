/**
 * Facing direction for a regiment on the battlefield
 */
export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTHEAST' | 'NORTHWEST' | 'SOUTHEAST' | 'SOUTHWEST';

/**
 * Base interface for regiment orders
 * This can be extended by specific order types
 */
export interface Order {
  type: string;
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
}
