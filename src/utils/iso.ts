/**
 * Isometric coordinate conversion utilities
 * 
 * This module provides functions to convert grid-based coordinates
 * to isometric screen coordinates for rendering.
 * 
 * Design rules:
 * - Pure utility functions with no side effects
 * - No dependencies on game logic or rendering libraries
 * - Configurable tile dimensions
 */

/**
 * Configuration for isometric tile dimensions
 */
export interface IsoConfig {
  tileWidth: number;
  tileHeight: number;
}

/**
 * Default isometric tile configuration
 */
export const DEFAULT_ISO_CONFIG: IsoConfig = {
  tileWidth: 64,
  tileHeight: 32,
};

/**
 * Convert grid coordinates to isometric screen coordinates
 * 
 * @param x - The x coordinate in grid space
 * @param y - The y coordinate in grid space
 * @param height - Optional height offset (default: 0)
 * @param config - Optional tile configuration (uses DEFAULT_ISO_CONFIG if not provided)
 * @returns Object with isoX and isoY screen coordinates
 * 
 * @example
 * // Convert grid position (2, 3) to isometric screen position
 * const { isoX, isoY } = gridToIso(2, 3);
 * 
 * @example
 * // Convert with custom tile size
 * const { isoX, isoY } = gridToIso(2, 3, 0, { tileWidth: 80, tileHeight: 40 });
 * 
 * @example
 * // Convert with height offset for elevated terrain
 * const { isoX, isoY } = gridToIso(2, 3, 10);
 */
export function gridToIso(
  x: number,
  y: number,
  height: number = 0,
  config: IsoConfig = DEFAULT_ISO_CONFIG
): { isoX: number; isoY: number } {
  const { tileWidth, tileHeight } = config;
  
  // Standard isometric projection formulas
  // isoX = (x - y) * (tileWidth / 2)
  // isoY = (x + y) * (tileHeight / 2) - height
  const isoX = (x - y) * (tileWidth / 2);
  const isoY = (x + y) * (tileHeight / 2) - height;
  
  return { isoX, isoY };
}
