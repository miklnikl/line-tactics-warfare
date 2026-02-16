import { GameState } from './GameState.ts';
import { GameMap } from './GameMap.ts';

/**
 * GameService provides a singleton GameState instance that can be shared
 * across the entire application (both Pixi renderer and React UI).
 * 
 * Design rules:
 * - Single source of truth for game state
 * - No dependencies on rendering or UI frameworks
 * - Pure game logic only
 * - Deterministic and replayable
 * 
 * Usage:
 * import { gameState } from './game/GameService.ts';
 */

// Create a game map with varied terrain heights
const gameMap = new GameMap(20, 20);

// Set some elevated terrain for visual demonstration
gameMap.setTileHeight(1, 1, 20);
gameMap.setTileHeight(5, 5, 15);
gameMap.setTileHeight(19, 19, 25);

// Create a small elevated plateau to showcase wall rendering
gameMap.setTileHeight(10, 10, 30);
gameMap.setTileHeight(11, 10, 30);
gameMap.setTileHeight(10, 11, 30);
gameMap.setTileHeight(11, 11, 30);

// Create a stepped elevation
gameMap.setTileHeight(15, 5, 10);
gameMap.setTileHeight(15, 6, 20);
gameMap.setTileHeight(15, 7, 30);

// Create and export the singleton GameState instance
export const gameState = new GameState(gameMap);
