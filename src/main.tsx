import type { Application } from 'pixi.js'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { gameState, regimentRegistry } from './game/GameService.ts'
import { TurnSimulator } from './game/TurnSimulator.ts'
import { GameLoop } from './game/GameLoop.ts'
import { PixiRenderer } from './render/PixiRenderer.ts'
import { Regiment } from './game/Regiment.ts'
import { InputHandler } from './input/InputHandler.ts'
import { commandService } from './game/CommandService.ts'
import type { RotateOrder } from './game/Order.ts'

// Create Regiment instances for WEGO turn system
const regiments = [
  new Regiment('regiment-1', 2, 3, 'NORTH'),
  new Regiment('regiment-2', 5, 5, 'EAST'),
  new Regiment('regiment-3', 8, 2, 'SOUTH')
]

// Populate the regiment registry so React hooks can read regiment data
for (const regiment of regiments) {
  regimentRegistry.set(regiment.getId(), regiment)
}

// Add regiments as units to game state for rendering
for (const regiment of regiments) {
  gameState.addUnit({ id: regiment.getId(), x: regiment.getX(), y: regiment.getY() })
}

// Create turn simulator with regiments
const turnSimulator = new TurnSimulator(regiments)
const gameLoop = new GameLoop(gameState, turnSimulator)

// Callback when PixiJS app is ready
function onAppReady(app: Application) {
  // Initialize the renderer
  const renderer = new PixiRenderer(app)

  // Initialize the input handler (attaches all canvas/keyboard listeners)
  new InputHandler(app, gameState, regiments, renderer)

  // Render the initial state
  renderer.render(gameState, regiments)

  // Start the game loop
  gameLoop.start()

  // Regiment map for O(1) lookups in command handlers
  const regimentMap = new Map(regiments.map(r => [r.getId(), r]))

  // Sync regiment positions to game state units before each render
  function syncRegimentsToGameState(): void {
    const units = gameState.getUnits()
    for (const unit of units) {
      const regiment = regimentMap.get(unit.id)
      if (regiment) {
        unit.x = regiment.getX()
        unit.y = regiment.getY()
      }
    }
  }

  // Continuous render ticker
  app.ticker.add(() => {
    renderer.updateCamera()
    syncRegimentsToGameState()
    renderer.render(gameState, regiments)
  })

  // ---------------------------------------------------------------------------
  // Command handlers – registered here so all game-layer logic stays out of UI
  // ---------------------------------------------------------------------------

  // Toggle move-target selection mode (MOVE button in React CommandPanel)
  commandService.registerMoveHandler(() => {
    commandService.setMoveMode(!commandService.isMoveMode)
  })

  // Assign a HOLD order to the selected regiment
  commandService.registerHoldHandler(() => {
    if (gameState.getPhase() !== 'PLANNING') return
    const selectedId = gameState.getSelectedRegimentId()
    if (!selectedId) return
    const regiment = regimentMap.get(selectedId)
    if (!regiment) return
    regiment.setOrder({ type: 'HOLD' })
    console.log(`HOLD order assigned to ${selectedId}`)
  })

  // Assign a ROTATE order to the selected regiment
  commandService.registerRotateHandler((dir) => {
    if (gameState.getPhase() !== 'PLANNING') return
    const selectedId = gameState.getSelectedRegimentId()
    if (!selectedId) return
    const regiment = regimentMap.get(selectedId)
    if (!regiment) return
    regiment.setDirection(dir)
    const rotateOrder: RotateOrder = { type: 'ROTATE', direction: dir }
    regiment.setOrder(rotateOrder)
    console.log(`ROTATE order assigned to ${selectedId}: direction ${dir}`)
  })

  // Start a new turn (End Turn button in React GameInfoPanel)
  commandService.registerEndTurnHandler(() => {
    if (gameState.getPhase() !== 'PLANNING') return
    turnSimulator.reset()
    gameState.startTurn()
  })
}

// Render React app with callback
const rootElement = document.getElementById('app')!
const root = createRoot(rootElement)
root.render(<App onAppReady={onAppReady} />)
