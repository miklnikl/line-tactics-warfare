import type { GameState } from '../game/GameState.ts';
import type { Regiment } from '../game/Regiment.ts';
import type { MoveOrder } from '../game/Order.ts';

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
    
    // Update panel content using DOM manipulation for security
    this.updatePanelContent(regiment);
  }

  /**
   * Update the panel content using safe DOM manipulation
   */
  private updatePanelContent(regiment: Regiment): void {
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
        const moveOrder = order as MoveOrder;
        orderText = `MOVE to (${moveOrder.targetX}, ${moveOrder.targetY})`;
      } else {
        orderText = order.type;
      }
    }
    
    // Clear existing content
    this.panelElement.innerHTML = '';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Regiment Info';
    this.panelElement.appendChild(title);
    
    // Create info rows
    this.appendInfoRow('ID', id);
    this.appendInfoRow('Position', `(${posX}, ${posY})`);
    this.appendInfoRow('Direction', direction);
    this.appendInfoRow('Order', orderText);
  }

  /**
   * Append an info row to the panel
   */
  private appendInfoRow(label: string, value: string): void {
    const row = document.createElement('div');
    row.className = 'info-row';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'info-label';
    labelSpan.textContent = `${label}:`;
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'info-value';
    valueSpan.textContent = value;
    
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    this.panelElement.appendChild(row);
  }
}
