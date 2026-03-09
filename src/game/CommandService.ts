type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
type MoveModeListener = (active: boolean) => void;

/**
 * CommandService bridges React UI components and the imperative game logic layer.
 *
 * Design rules:
 * - No React or PixiJS dependencies
 * - Handlers are registered by the game layer (main.tsx / CommandPanel.ts)
 * - Commands are invoked by the UI layer (React components)
 * - Move-mode state is owned here and observed via subscription
 */
class CommandServiceClass {
  private _isMoveMode = false;
  private moveModeListeners = new Set<MoveModeListener>();

  private moveHandler?: () => void;
  private holdHandler?: () => void;
  private rotateHandler?: (dir: Direction) => void;
  private endTurnHandler?: () => void;
  private removeOrderHandler?: (index: number) => void;
  private moveOrderUpHandler?: (index: number) => void;
  private moveOrderDownHandler?: (index: number) => void;

  // ---------------------------------------------------------------------------
  // Handler registration (called from game logic)
  // ---------------------------------------------------------------------------

  registerMoveHandler(handler: () => void): void {
    this.moveHandler = handler;
  }

  registerHoldHandler(handler: () => void): void {
    this.holdHandler = handler;
  }

  registerRotateHandler(handler: (dir: Direction) => void): void {
    this.rotateHandler = handler;
  }

  registerEndTurnHandler(handler: () => void): void {
    this.endTurnHandler = handler;
  }

  registerRemoveOrderHandler(handler: (index: number) => void): void {
    this.removeOrderHandler = handler;
  }

  registerMoveOrderUpHandler(handler: (index: number) => void): void {
    this.moveOrderUpHandler = handler;
  }

  registerMoveOrderDownHandler(handler: (index: number) => void): void {
    this.moveOrderDownHandler = handler;
  }

  // ---------------------------------------------------------------------------
  // Command invocation (called from React UI)
  // ---------------------------------------------------------------------------

  move(): void {
    this.moveHandler?.();
  }

  hold(): void {
    this.holdHandler?.();
  }

  rotate(dir: Direction): void {
    this.rotateHandler?.(dir);
  }

  endTurn(): void {
    this.endTurnHandler?.();
  }

  removeOrder(index: number): void {
    this.removeOrderHandler?.(index);
  }

  moveOrderUp(index: number): void {
    this.moveOrderUpHandler?.(index);
  }

  moveOrderDown(index: number): void {
    this.moveOrderDownHandler?.(index);
  }

  // ---------------------------------------------------------------------------
  // Move-mode state (set by game logic, observed by React UI)
  // ---------------------------------------------------------------------------

  get isMoveMode(): boolean {
    return this._isMoveMode;
  }

  setMoveMode(active: boolean): void {
    if (this._isMoveMode === active) return;
    this._isMoveMode = active;
    this.moveModeListeners.forEach(l => l(active));
  }

  onMoveModeChange(listener: MoveModeListener): () => void {
    this.moveModeListeners.add(listener);
    return () => { this.moveModeListeners.delete(listener); };
  }
}

export const commandService = new CommandServiceClass();
