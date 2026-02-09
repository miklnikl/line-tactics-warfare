import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';

/**
 * RegimentInfoPanel displays information about the currently selected regiment.
 * 
 * Design rules:
 * - No PixiJS dependencies
 * - Reads data from GameState only
 * - Updates when selection changes
 * - Hides when no regiment is selected
 * - Works independently from rendering loop
 */
export class RegimentInfoPanel {
  private panelElement: HTMLElement;
  private gameState: GameState;
  private regimentMap: Map<string, Regiment>;

  constructor(gameState: GameState, regiments: Regiment[]) {
    this.gameState = gameState;
    this.regimentMap = new Map(regiments.map(r => [r.getId(), r]));
    
    // Get the panel element from the DOM
    const panel = document.getElementById('regiment-info-panel');
    if (!panel) {
      throw new Error('Regiment info panel element not found in DOM');
    }
    this.panelElement = panel;
    
    // Initialize panel state
    this.update();
  }

  /**
   * Update the panel with current regiment information
   * Call this when selection changes or regiment data changes
   */
  update(): void {
    const selectedId = this.gameState.getSelectedRegimentId();
    
    if (!selectedId) {
      // Hide panel when no regiment is selected
      this.panelElement.style.display = 'none';
      return;
    }
    
    // Get the selected regiment
    const regiment = this.regimentMap.get(selectedId);
    if (!regiment) {
      // Hide panel if regiment not found
      this.panelElement.style.display = 'none';
      return;
    }
    
    // Show panel and update content
    this.panelElement.style.display = 'block';
    
    // Update panel content
    const content = this.buildPanelContent(regiment);
    this.panelElement.innerHTML = content;
  }

  /**
   * Build the HTML content for the panel
   */
  private buildPanelContent(regiment: Regiment): string {
    const id = regiment.getId();
    const x = regiment.getX();
    const y = regiment.getY();
    const direction = regiment.getDirection();
    const order = regiment.getOrder();
    
    // Format position with 1 decimal place for display
    const posX = x.toFixed(1);
    const posY = y.toFixed(1);
    
    // Format order information
    let orderText = 'None';
    if (order) {
      if (order.type === 'MOVE') {
        const moveOrder = order as any; // Type assertion for MoveOrder
        orderText = `MOVE to (${moveOrder.targetX}, ${moveOrder.targetY})`;
      } else {
        orderText = order.type;
      }
    }
    
    return `
      <h3>Regiment Info</h3>
      <div class="info-row">
        <span class="info-label">ID:</span>
        <span class="info-value">${id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Position:</span>
        <span class="info-value">(${posX}, ${posY})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Direction:</span>
        <span class="info-value">${direction}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order:</span>
        <span class="info-value">${orderText}</span>
      </div>
    `;
  }
}
