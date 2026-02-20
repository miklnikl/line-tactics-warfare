import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { MoveOrder, HoldOrder, RotateOrder } from '../game/Order.ts';
import { calculateDirectionFromDelta } from '../game/Regiment.ts';
import type { Application } from 'pixi.js';
import type { PixiRenderer } from '../renderer/PixiRenderer.ts';

/**
 * CommandPanel provides UI controls to issue orders to the selected regiment.
 * 
 * Design rules:
 * - Commands can only be issued during PLANNING phase
 * - Issuing a command updates regiment.order
 * - UI does not simulate or validate movement
 * - Orders are immutable once SIMULATION starts
 */
export class CommandPanel {
  private panelElement: HTMLElement;
  private gameState: GameState;
  private regimentMap: Map<string, Regiment>;
  private app: Application;
  private renderer: PixiRenderer;
  private moveMode: boolean = false;
  private moveButton: HTMLButtonElement;
  private holdButton: HTMLButtonElement;
  private directionButtons: Map<'NORTH' | 'SOUTH' | 'EAST' | 'WEST', HTMLButtonElement> = new Map();
  private canvasClickHandler!: (event: MouseEvent) => void;
  private canvasContextMenuHandler!: (event: MouseEvent) => void;
  private keydownHandler!: (event: KeyboardEvent) => void;
  private previousSelectedRegimentId: string | null = null;

  constructor(gameState: GameState, regiments: Regiment[], app: Application, renderer: PixiRenderer) {
    this.gameState = gameState;
    this.regimentMap = new Map(regiments.map(r => [r.getId(), r]));
    this.app = app;
    this.renderer = renderer;
    
    // Get the panel element from the DOM
    const panel = document.getElementById('command-panel');
    if (!panel) {
      throw new Error('Command panel element not found in DOM');
    }
    this.panelElement = panel;
    
    // Create UI elements
    this.moveButton = this.createButton('MOVE', () => this.handleMoveCommand());
    this.moveButton.title = 'Select target tile on map (click again to cancel)';
    this.holdButton = this.createButton('HOLD', () => this.handleHoldCommand());
    this.holdButton.title = 'Hold current position';
    
    // Build panel structure
    this.buildPanel();
    
    // Set up canvas click listener for move target selection
    this.setupCanvasClickListener();
    
    // Set up right-click and ESC key handlers for cancellation
    this.setupCancellationHandlers();
    
    // Initialize panel state
    this.update();
  }

  /**
   * Create a button element
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'command-button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Build the panel structure
   */
  private buildPanel(): void {
    // Clear existing content
    this.panelElement.innerHTML = '';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Commands';
    this.panelElement.appendChild(title);
    
    // Add main command buttons
    this.panelElement.appendChild(this.moveButton);
    this.panelElement.appendChild(this.holdButton);
    
    // Create container for directional buttons
    const directionContainer = document.createElement('div');
    directionContainer.className = 'direction-buttons-container';
    
    // Create directional buttons for rotation
    const directions: Array<'NORTH' | 'SOUTH' | 'EAST' | 'WEST'> = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    for (const direction of directions) {
      const button = this.createButton(direction, () => this.handleRotateDirection(direction));
      button.className = 'command-button direction-button';
      button.title = `Rotate to face ${direction}`;
      this.directionButtons.set(direction, button);
      directionContainer.appendChild(button);
    }
    
    this.panelElement.appendChild(directionContainer);
  }

  /**
   * Update the panel based on current game state
   */
  update(): void {
    const phase = this.gameState.getPhase();
    const selectedId = this.gameState.getSelectedRegimentId();
    
    // Show panel only when a regiment is selected and in PLANNING phase
    if (phase !== 'PLANNING' || !selectedId) {
      this.panelElement.style.display = 'none';
      this.moveMode = false;
      this.previousSelectedRegimentId = null;
      this.moveButton.classList.remove('pressed');
      return;
    }
    
    // Detect when a new regiment is selected and auto-activate MOVE mode
    if (selectedId !== this.previousSelectedRegimentId && !this.moveMode) {
      this.moveMode = true;
    }
    this.previousSelectedRegimentId = selectedId;
    
    this.panelElement.style.display = 'block';
    
    // Update button states based on move mode
    if (this.moveMode) {
      // In move mode: MOVE button has pressed state
      this.moveButton.classList.add('pressed');
    } else {
      // Normal mode: MOVE button is unpressed
      this.moveButton.classList.remove('pressed');
    }
  }

  /**
   * Handle MOVE command button click
   */
  private handleMoveCommand(): void {
    if (this.gameState.getPhase() !== 'PLANNING') {
      return;
    }
    
    // Toggle move mode - clicking the button cancels if already in move mode
    if (this.moveMode) {
      this.moveMode = false;
    } else {
      this.moveMode = true;
    }
    
    this.update();
  }

  /**
   * Handle HOLD command button click
   */
  private handleHoldCommand(): void {
    if (this.gameState.getPhase() !== 'PLANNING') {
      return;
    }
    
    const selectedId = this.gameState.getSelectedRegimentId();
    if (!selectedId) {
      return;
    }
    
    const regiment = this.regimentMap.get(selectedId);
    if (!regiment) {
      return;
    }
    
    // Assign HOLD order
    const holdOrder: HoldOrder = { type: 'HOLD' };
    regiment.setOrder(holdOrder);
    
    console.log(`HOLD order assigned to ${selectedId}`);
  }

  /**
   * Handle rotation direction button click - directly rotate without entering a mode
   */
  private handleRotateDirection(direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'): void {
    if (this.gameState.getPhase() !== 'PLANNING') {
      return;
    }
    
    const selectedId = this.gameState.getSelectedRegimentId();
    if (!selectedId) {
      return;
    }
    
    const regiment = this.regimentMap.get(selectedId);
    if (!regiment) {
      return;
    }
    
    // Set the direction
    regiment.setDirection(direction);
    
    // Assign ROTATE order
    const rotateOrder: RotateOrder = { type: 'ROTATE', direction };
    regiment.setOrder(rotateOrder);
    
    console.log(`ROTATE order assigned to ${selectedId}: direction ${direction}`);
  }

  /**
   * Cancel move mode
   */
  private cancelMoveMode(): void {
    this.moveMode = false;
    this.update();
  }

  /**
   * Get the regiment at a specific position
   * @param x - The x coordinate to check
   * @param y - The y coordinate to check
   * @param excludeRegimentId - The regiment ID to exclude from the search (optional)
   * @returns The regiment at this position, or null if none found
   */
  private getRegimentAtPosition(x: number, y: number, excludeRegimentId?: string): Regiment | null {
    const regimentTileX = Math.round(x);
    const regimentTileY = Math.round(y);
    
    for (const [regimentId, regiment] of this.regimentMap) {
      // Skip the excluded regiment if provided
      if (excludeRegimentId && regimentId === excludeRegimentId) {
        continue;
      }
      
      const regimentX = Math.round(regiment.getX());
      const regimentY = Math.round(regiment.getY());
      
      // Check if this regiment is at the position
      if (regimentX === regimentTileX && regimentY === regimentTileY) {
        return regiment;
      }
    }
    
    return null;
  }

  /**
   * Check if a tile is already targeted as a move destination by another regiment
   * @param x - The x coordinate to check
   * @param y - The y coordinate to check
   * @param excludeRegimentId - The regiment ID to exclude from the check
   * @returns True if another regiment is targeting this tile, false otherwise
   */
  private isTileTargetedByOtherRegiment(x: number, y: number, excludeRegimentId: string): boolean {
    const targetTileX = Math.round(x);
    const targetTileY = Math.round(y);
    
    for (const [regimentId, regiment] of this.regimentMap) {
      // Skip the regiment we're checking for
      if (regimentId === excludeRegimentId) {
        continue;
      }
      
      const order = regiment.getOrder();
      if (order && order.type === 'MOVE') {
        const moveOrder = order as MoveOrder;
        if (moveOrder.targetX === targetTileX && moveOrder.targetY === targetTileY) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Set up canvas click listener for move target selection
   */
  private setupCanvasClickListener(): void {
    this.canvasClickHandler = (event) => {
      if (!this.moveMode || this.gameState.getPhase() !== 'PLANNING') {
        return;
      }
      
      // Stop the event from propagating to InputHandler
      event.stopImmediatePropagation();
      event.preventDefault();
      
      const selectedId = this.gameState.getSelectedRegimentId();
      if (!selectedId) {
        return;
      }
      
      const regiment = this.regimentMap.get(selectedId);
      if (!regiment) {
        return;
      }
      
      // Get canvas coordinates
      const rect = this.app.canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      
      // Convert canvas to grid coordinates using the renderer's method
      // This accounts for the map centering offset
      const { gridX, gridY } = this.renderer.screenToGrid(canvasX, canvasY);
      
      // Round to nearest integer for tile coordinates
      const targetX = Math.round(gridX);
      const targetY = Math.round(gridY);
      
      // Validate that the target is within map bounds
      const map = this.gameState.getMap();
      if (!map.isValidPosition(targetX, targetY)) {
        console.log(`Invalid target position (${targetX}, ${targetY}) - outside map bounds`);
        return;
      }
      
      // Check if target tile is already occupied by another regiment
      const occupyingRegiment = this.getRegimentAtPosition(targetX, targetY, selectedId);
      if (occupyingRegiment) {
        // Auto-select the regiment on the occupied tile
        console.log(`Tile occupied by ${occupyingRegiment.getId()} - selecting that regiment`);
        this.gameState.setSelectedRegimentId(occupyingRegiment.getId());
        this.moveMode = false;
        this.update();
        return;
      }
      
      // Check if target tile is already targeted by another regiment
      const isDoubleTargeted = this.isTileTargetedByOtherRegiment(targetX, targetY, selectedId);
      if (isDoubleTargeted) {
        console.log(`Target position (${targetX}, ${targetY}) - already targeted by another regiment`);
        return;
      }
      
      // Check if target is the same tile as current position
      const currentX = Math.round(regiment.getX());
      const currentY = Math.round(regiment.getY());
      if (targetX === currentX && targetY === currentY) {
        console.log(`Target position (${targetX}, ${targetY}) - same as current position`);
        return;
      }
      
      // Calculate and set direction based on movement vector
      const deltaX = targetX - regiment.getX();
      const deltaY = targetY - regiment.getY();
      const newDirection = calculateDirectionFromDelta(deltaX, deltaY);
      regiment.setDirection(newDirection);
      
      // Assign MOVE order with validated target position
      const moveOrder: MoveOrder = {
        type: 'MOVE',
        targetX,
        targetY
      };
      regiment.setOrder(moveOrder);
      
      console.log(`MOVE order assigned to ${selectedId}: target (${moveOrder.targetX}, ${moveOrder.targetY})`);
      
      // Exit move mode
      this.moveMode = false;
      this.update();
    };
    
    this.app.canvas.addEventListener('click', this.canvasClickHandler, true); // Use capture phase to run before InputHandler
  }

  /**
   * Set up right-click and ESC key handlers for cancellation
   */
  private setupCancellationHandlers(): void {
    // Right-click handler to cancel move mode
    this.canvasContextMenuHandler = (event) => {
      if (this.moveMode) {
        event.preventDefault();
        this.cancelMoveMode();
      }
    };
    
    this.app.canvas.addEventListener('contextmenu', this.canvasContextMenuHandler, true); // Use capture phase for consistency
    
    // ESC key handler to cancel move mode
    this.keydownHandler = (event) => {
      if (event.key === 'Escape' && this.moveMode) {
        this.cancelMoveMode();
      }
    };
    
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Clean up resources and event listeners
   */
  destroy(): void {
    if (this.canvasClickHandler) {
      this.app.canvas.removeEventListener('click', this.canvasClickHandler, true);
    }
    if (this.canvasContextMenuHandler) {
      this.app.canvas.removeEventListener('contextmenu', this.canvasContextMenuHandler, true);
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
  }
}
