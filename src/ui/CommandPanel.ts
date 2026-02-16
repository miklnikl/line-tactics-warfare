import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { MoveOrder, HoldOrder } from '../game/Order.ts';
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
  private cancelButton: HTMLButtonElement;
  private statusText: HTMLElement;
  private canvasClickHandler!: (event: MouseEvent) => void;
  private canvasContextMenuHandler!: (event: MouseEvent) => void;
  private keydownHandler!: (event: KeyboardEvent) => void;

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
    this.holdButton = this.createButton('HOLD', () => this.handleHoldCommand());
    this.cancelButton = this.createButton('Cancel', () => this.cancelMoveMode());
    this.cancelButton.style.display = 'none';
    
    this.statusText = document.createElement('div');
    this.statusText.className = 'command-status';
    
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
    
    // Add buttons
    this.panelElement.appendChild(this.moveButton);
    this.panelElement.appendChild(this.holdButton);
    this.panelElement.appendChild(this.cancelButton);
    
    // Add status text
    this.panelElement.appendChild(this.statusText);
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
      return;
    }
    
    this.panelElement.style.display = 'block';
    
    // Update button states
    if (this.moveMode) {
      this.moveButton.style.display = 'none';
      this.holdButton.style.display = 'none';
      this.cancelButton.style.display = 'block';
      this.statusText.textContent = 'Click on the map to set move target';
      this.statusText.style.display = 'block';
    } else {
      this.moveButton.style.display = 'block';
      this.holdButton.style.display = 'block';
      this.cancelButton.style.display = 'none';
      this.statusText.style.display = 'none';
    }
  }

  /**
   * Handle MOVE command button click
   */
  private handleMoveCommand(): void {
    if (this.gameState.getPhase() !== 'PLANNING') {
      return;
    }
    
    const selectedId = this.gameState.getSelectedRegimentId();
    if (!selectedId) {
      return;
    }
    
    // Enter move mode - wait for canvas click to set target
    this.moveMode = true;
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
   * Cancel move mode
   */
  private cancelMoveMode(): void {
    this.moveMode = false;
    this.update();
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
        this.statusText.textContent = 'Invalid target - click within the map';
        this.statusText.style.color = '#ff6b6b';
        setTimeout(() => {
          this.statusText.textContent = 'Click on the map to set move target';
          this.statusText.style.color = '';
        }, 1500);
        return;
      }
      
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
