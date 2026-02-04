/**
 * Order types for WEGO gameplay
 * Defines all possible order types that can be assigned to regiments
 */
export type OrderType = 'MOVE';
// Future order types can be added here:
// export type OrderType = 'MOVE' | 'ATTACK' | 'DEFEND' | 'HOLD';

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
