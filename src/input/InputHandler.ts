import type { Application } from 'pixi.js';
import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';
import { calculateDirectionFromDelta } from '../game/Regiment.ts';
import type { PixiRenderer } from '../render/PixiRenderer.ts';
import type { MoveOrder } from '../game/Order.ts';
import { commandService } from '../game/CommandService.ts';

/**
 * InputHandler manages all canvas user input for the game.
 *
 * Design rules:
 * - Handles input events from the canvas (clicks, right-click, keyboard)
 * - Delegates game-state mutations to GameState / commandService
 * - Contains no simulation logic; only input routing and order assignment
 * - Works only during the PLANNING phase
 *
 * Responsibilities:
 * - Regiment selection (left-click on regiment tile)
 * - Move target selection when move mode is active (via commandService.isMoveMode)
 * - Auto-activates move mode when a regiment is selected
 * - ESC / right-click cancels move mode
 */
export class InputHandler {
  private app: Application;
  private gameState: GameState;
  private regiments: Regiment[];
  private regimentMap: Map<string, Regiment>;
  private renderer: PixiRenderer;

  constructor(
    app: Application,
    gameState: GameState,
    regiments: Regiment[],
    renderer: PixiRenderer
  ) {
    this.app = app;
    this.gameState = gameState;
    this.regiments = regiments;
    this.regimentMap = new Map(regiments.map(r => [r.getId(), r]));
    this.renderer = renderer;

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for canvas interactions
   */
  private setupEventListeners(): void {
    // Use capture phase so move-mode clicks are intercepted before other listeners
    this.app.canvas.addEventListener('click', this.handleClick, true);
    this.app.canvas.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle click events on the canvas.
   * When move mode is active the click assigns a MOVE order to the selected
   * regiment; otherwise it selects (or deselects) a regiment.
   */
  private handleClick = (event: MouseEvent): void => {
    if (this.gameState.getPhase() !== 'PLANNING') {
      return;
    }

    const rect = this.app.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const { gridX, gridY } = this.renderer.screenToGrid(canvasX, canvasY);
    const roundedX = Math.round(gridX);
    const roundedY = Math.round(gridY);

    if (commandService.isMoveMode) {
      // Consume the event so other listeners (e.g. PixiJS) don't also react
      event.stopImmediatePropagation();
      this.handleMoveTarget(roundedX, roundedY);
    } else {
      this.handleSelection(roundedX, roundedY);
    }
  };

  /**
   * Assign a MOVE order to the selected regiment for the clicked tile.
   */
  private handleMoveTarget(targetX: number, targetY: number): void {
    const selectedId = this.gameState.getSelectedRegimentId();
    if (!selectedId) return;

    const regiment = this.regimentMap.get(selectedId);
    if (!regiment) return;

    // Validate map bounds
    const map = this.gameState.getMap();
    if (!map.isValidPosition(targetX, targetY)) {
      console.log(`Invalid target position (${targetX}, ${targetY}) - outside map bounds`);
      return;
    }

    // If the tile holds another regiment, select that regiment instead
    const occupyingRegiment = this.findRegimentAtPosition(targetX, targetY);
    if (occupyingRegiment && occupyingRegiment.getId() !== selectedId) {
      console.log(`Tile occupied by ${occupyingRegiment.getId()} - selecting that regiment`);
      this.gameState.setSelectedRegimentId(occupyingRegiment.getId());
      commandService.setMoveMode(true);
      return;
    }

    // Ignore clicks on the regiment's own tile
    const currentX = Math.round(regiment.getX());
    const currentY = Math.round(regiment.getY());
    if (targetX === currentX && targetY === currentY) {
      console.log(`Target position (${targetX}, ${targetY}) - same as current position`);
      return;
    }

    // Prevent two regiments from targeting the same tile
    if (this.isTileTargetedByOtherRegiment(targetX, targetY, selectedId)) {
      console.log(`Target position (${targetX}, ${targetY}) - already targeted by another regiment`);
      return;
    }

    // Set facing direction based on movement vector
    const deltaX = targetX - regiment.getX();
    const deltaY = targetY - regiment.getY();
    regiment.setDirection(calculateDirectionFromDelta(deltaX, deltaY));

    // Assign the MOVE order
    const moveOrder: MoveOrder = { type: 'MOVE', targetX, targetY };
    regiment.setOrder(moveOrder);
    console.log(`MOVE order assigned to ${selectedId}: target (${targetX}, ${targetY})`);

    // Exit move mode after assigning the order
    commandService.setMoveMode(false);
  }

  /**
   * Select or deselect a regiment based on the clicked tile.
   * Automatically activates move mode when a regiment is newly selected.
   */
  private handleSelection(gridX: number, gridY: number): void {
    const clickedRegiment = this.findRegimentAtPosition(gridX, gridY);

    if (clickedRegiment) {
      this.gameState.setSelectedRegimentId(clickedRegiment.getId());
      // Auto-activate move mode so the player can immediately pick a target
      commandService.setMoveMode(true);
    } else {
      this.gameState.setSelectedRegimentId(null);
    }
  }

  /**
   * Right-click cancels move mode when it is active.
   */
  private handleContextMenu = (event: MouseEvent): void => {
    if (commandService.isMoveMode) {
      event.preventDefault();
      commandService.setMoveMode(false);
    }
  };

  /**
   * ESC key cancels move mode when it is active.
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && commandService.isMoveMode) {
      commandService.setMoveMode(false);
    }
  };

  /**
   * Check whether another regiment has already targeted the given tile as a
   * MOVE destination (prevents two units from being ordered to the same tile).
   */
  private isTileTargetedByOtherRegiment(
    x: number,
    y: number,
    excludeRegimentId: string,
  ): boolean {
    for (const [regimentId, regiment] of this.regimentMap) {
      if (regimentId === excludeRegimentId) continue;
      const order = regiment.getOrder();
      if (order?.type === 'MOVE') {
        const moveOrder = order as MoveOrder;
        if (moveOrder.targetX === Math.round(x) && moveOrder.targetY === Math.round(y)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Find a regiment occupying the exact given grid tile.
   */
  private findRegimentAtPosition(gridX: number, gridY: number): Regiment | null {
    for (const regiment of this.regiments) {
      const regimentX = Math.round(regiment.getX());
      const regimentY = Math.round(regiment.getY());

      if (regimentX === gridX && regimentY === gridY) {
        return regiment;
      }
    }
    return null;
  }

  /**
   * Clean up all event listeners.
   */
  destroy(): void {
    this.app.canvas.removeEventListener('click', this.handleClick, true);
    this.app.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
