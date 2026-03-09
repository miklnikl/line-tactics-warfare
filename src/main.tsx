import type { Application } from 'pixi.js'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { gameState, regimentRegistry } from './game/GameService.ts'
import { TurnSimulator } from './game/TurnSimulator.ts'
import { GameLoop } from './game/GameLoop.ts'
import { PixiRenderer } from './renderer/PixiRenderer.ts'
import { Regiment, calculateDirectionFromDelta } from './game/Regiment.ts'
import type { MoveOrder } from './game/Order.ts'
import { InputHandler } from './input/InputHandler.ts'
import { RegimentInfoPanel } from './ui/RegimentInfoPanel.ts'
import { CommandPanel } from './ui/CommandPanel.ts'
import { commandService } from './game/CommandService.ts'

// Use the shared GameState instance from GameService
// The map configuration is now centralized in GameService

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

  // Initialize the input handler for its side effects (sets up event listeners on canvas)
  // The instance is not used directly, but its constructor attaches necessary event handlers
  const inputHandler = new InputHandler(app, gameState, regiments, renderer)
  void inputHandler // Keep reference to prevent garbage collection

  // Initialize the regiment info panel
  const regimentInfoPanel = new RegimentInfoPanel(gameState, regiments)

  // Initialize the command panel
  const commandPanel = new CommandPanel(gameState, regiments, app, renderer)

  // Render the initial state
  renderer.render(gameState, regiments)

  // Start the game loop
  gameLoop.start()

  // Create a map of regiment ID to regiment for O(1) lookups
  const regimentMap = new Map(regiments.map(r => [r.getId(), r]))

  // Sync regiment positions to game state for rendering
  function syncRegimentsToGameState(): void {
    const units = gameState.getUnits()
    
    // Update each unit's position from its corresponding regiment
    for (const unit of units) {
      const regiment = regimentMap.get(unit.id)
      if (regiment) {
        unit.x = regiment.getX()
        unit.y = regiment.getY()
      }
    }
  }

  // Add a ticker to continuously render the game state
  app.ticker.add(() => {
    // Update camera position based on keyboard input
    renderer.updateCamera()
    
    // Sync positions before rendering
    syncRegimentsToGameState()
    renderer.render(gameState, regiments)
    
    // Update the regiment info panel
    regimentInfoPanel.update()
    
    // Update the command panel
    commandPanel.update()
  })

  // For demonstration: Add debug logging and a button to start simulation
  console.log('Game loop started!')
  console.log('Current phase:', gameState.getPhase())
  console.log('Map dimensions:', gameState.getMap().getWidth(), 'x', gameState.getMap().getHeight())
  console.log('Regiments created:', regiments.map(r => ({ id: r.getId(), x: r.getX(), y: r.getY() })))
  console.log('\nControls:')
  console.log('- Arrow keys or WASD: Pan camera')
  console.log('- Click regiment: Select unit')
  console.log('- MOVE button: Enter move mode, then click destination')
  console.log('- HOLD button: Issue hold order')
  console.log('\nTo test WEGO turn:')
  console.log('1. Press "M" to assign a MoveOrder to regiment-1')
  console.log('2. Click "End Turn" button or press "S" to start simulation')
  console.log('3. Watch the regiment move to target position')
  console.log('4. After 100 ticks, game returns to PLANNING phase')

  // Add keyboard event to assign move order and start simulation for testing
  document.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
      if (gameState.getPhase() === 'PLANNING') {
        // Assign a move order to regiment 1: move from (2,3) to (10,10)
        const moveOrder: MoveOrder = {
          type: 'MOVE',
          targetState: {
            x: 10,
            y: 10,
            direction: calculateDirectionFromDelta(10 - regiments[0].getX(), 10 - regiments[0].getY())
          }
        }
        regiments[0].setOrder(moveOrder)
        console.log('Move order assigned to regiment-1: target (10, 10)')
        console.log('Current position:', regiments[0].getX(), regiments[0].getY())
      }
    }
    
    if (event.key === 's' || event.key === 'S') {
      if (gameState.getPhase() === 'PLANNING') {
        // Reset turn simulator before starting
        turnSimulator.reset()
        gameState.startTurn()
        console.log('\n=== SIMULATION STARTED ===')
        console.log('Current phase:', gameState.getPhase())
        console.log('Turn will run for', TurnSimulator.getTicksPerTurn(), 'ticks')
        
        // Log progress periodically
        const logInterval = setInterval(() => {
          const tick = turnSimulator.getCurrentTick()
          const phase = gameState.getPhase()
          
          if (tick % 20 === 0 || phase === 'PLANNING') {
            console.log(`Tick: ${tick}/${TurnSimulator.getTicksPerTurn()} | Phase: ${phase}`)
            console.log('regiment-1 position:', regiments[0].getX().toFixed(2), regiments[0].getY().toFixed(2))
          }
          
          if (phase === 'PLANNING') {
            console.log('\n=== SIMULATION COMPLETED ===')
            console.log('Back to PLANNING phase')
            console.log('Final regiment-1 position:', regiments[0].getX(), regiments[0].getY())
            clearInterval(logInterval)
          }
        }, 100)
      }
    }
  })

  // Register the end-turn handler so the React GameInfoPanel can trigger it via commandService
  commandService.registerEndTurnHandler(() => {
    if (gameState.getPhase() === 'PLANNING') {
      // Reset turn simulator before starting
      turnSimulator.reset()
      gameState.startTurn()
      console.log('\n=== Turn started via End Turn button! ===')
      console.log('Current phase:', gameState.getPhase())

      // Log completion when turn ends
      const checkCompletion = setInterval(() => {
        if (gameState.getPhase() === 'PLANNING') {
          console.log('\n=== Turn completed! ===')
          console.log('Back to PLANNING phase')
          clearInterval(checkCompletion)
        }
      }, 100)
    }
  })
}

// Render React app with callback
const rootElement = document.getElementById('app')!
const root = createRoot(rootElement)
root.render(<App onAppReady={onAppReady} />)
