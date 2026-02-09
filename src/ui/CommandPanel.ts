import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { MoveOrder, HoldOrder } from '../game/Order.ts';
import type { Application } from 'pixi.js';
import { isoToGrid, DEFAULT_ISO_CONFIG } from '../utils/iso.ts';

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
  private moveMode: boolean = false;
  private moveButton: HTMLButtonElement;
  private holdButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;
  private statusText: HTMLElement;
  private canvasClickHandler: (event: MouseEvent) => void;

  constructor(gameState: GameState, regiments: Regiment[], app: Application) {
    this.gameState = gameState;
    this.regimentMap = new Map(regiments.map(r => [r.getId(), r]));
    this.app = app;
    
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
      
      // Convert canvas to grid coordinates using the same method as InputHandler
      const { gridX, gridY } = isoToGrid(canvasX, canvasY, DEFAULT_ISO_CONFIG);
      
      // Assign MOVE order with target position (rounded to nearest integer)
      const moveOrder: MoveOrder = {
        type: 'MOVE',
        targetX: Math.round(gridX),
        targetY: Math.round(gridY)
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
   * Clean up resources and event listeners
   */
  destroy(): void {
    if (this.canvasClickHandler) {
      this.app.canvas.removeEventListener('click', this.canvasClickHandler, true);
    }
  }
}
