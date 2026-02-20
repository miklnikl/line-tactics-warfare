/**
 * Order types for WEGO gameplay
 * Defines all possible order types that can be assigned to regiments
 * 
 * Note: Using a type alias instead of enum due to erasableSyntaxOnly constraint
 * in tsconfig.json, which requires types to be erasable at runtime.
 * Future order types can be added using union types: 'MOVE' | 'ATTACK' | 'DEFEND'
 */
export type OrderType = 'MOVE' | 'HOLD' | 'ROTATE';
// Future order types can be added here:
// export type OrderType = 'MOVE' | 'ATTACK' | 'DEFEND' | 'HOLD' | 'ROTATE';

/**
 * Base interface for regiment orders
 * All orders must implement this interface
 * Orders are pure data objects that can be assigned during the PLANNING phase
 */
export interface Order {
  type: OrderType;
}

/**
 * Move order with target grid position
 * Instructs a regiment to move to a specific grid coordinate
 */
export interface MoveOrder extends Order {
  type: 'MOVE';
  targetX: number;
  targetY: number;
}

/**
 * Hold order - regiment stays in place
 * Instructs a regiment to hold its current position
 */
export interface HoldOrder extends Order {
  type: 'HOLD';
}

/**
 * Rotate order - regiment changes facing direction only
 * Instructs a regiment to rotate to face a specific cardinal direction
 * Does not change position, only the direction the regiment faces
 */
export interface RotateOrder extends Order {
  type: 'ROTATE';
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
}
