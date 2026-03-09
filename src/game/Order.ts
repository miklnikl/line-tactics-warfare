import type { RegimentState } from './Regiment.ts';

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
 * The targetState defines the desired state the regiment should reach when this order completes
 */
export interface Order {
  type: OrderType;
  targetState: RegimentState;
}

/**
 * Move order - instructs a regiment to move to a target position
 * The target position and facing direction are encoded in targetState
 */
export interface MoveOrder extends Order {
  type: 'MOVE';
}

/**
 * Hold order - regiment stays in place
 * Instructs a regiment to hold its current position
 * targetState reflects the regiment's current state (no change)
 */
export interface HoldOrder extends Order {
  type: 'HOLD';
}

/**
 * Rotate order - regiment changes facing direction only
 * Instructs a regiment to rotate to face the direction specified in targetState
 * Does not change position, only the direction the regiment faces
 */
export interface RotateOrder extends Order {
  type: 'ROTATE';
}
