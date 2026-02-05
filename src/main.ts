import { Application } from 'pixi.js'
import { GameState } from './game/GameState.ts'
import { GameMap } from './game/GameMap.ts'
import { TurnSimulator } from './game/TurnSimulator.ts'
import { GameLoop } from './game/GameLoop.ts'
import { PixiRenderer } from './renderer/PixiRenderer.ts'
import { Regiment } from './game/Regiment.ts'
import type { MoveOrder } from './game/Order.ts'

// Create a PixiJS Application
const app = new Application()

// Initialize the application
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
})

// Append the canvas to the document
document.querySelector<HTMLDivElement>('#app')!.appendChild(app.canvas)

// Create a game map with varied terrain heights
const gameMap = new GameMap(20, 20)
// Set some elevated terrain for visual demonstration
gameMap.setTileHeight(2, 3, 20)
gameMap.setTileHeight(5, 5, 15)
gameMap.setTileHeight(8, 2, 25)

// Initialize game logic (independent of PixiJS)
const gameState = new GameState(gameMap)

// Create Regiment instances for WEGO turn system
const regiment1 = new Regiment('regiment-1', 2, 3, 'NORTH')
const regiment2 = new Regiment('regiment-2', 5, 5, 'EAST')
const regiment3 = new Regiment('regiment-3', 8, 2, 'SOUTH')

// Add regiments as units to game state for rendering
gameState.addUnit({ id: regiment1.getId(), x: regiment1.getX(), y: regiment1.getY() })
gameState.addUnit({ id: regiment2.getId(), x: regiment2.getX(), y: regiment2.getY() })
gameState.addUnit({ id: regiment3.getId(), x: regiment3.getX(), y: regiment3.getY() })

// Create turn simulator with regiments
const turnSimulator = new TurnSimulator([regiment1, regiment2, regiment3])
const gameLoop = new GameLoop(gameState, turnSimulator)

// Initialize the renderer
const renderer = new PixiRenderer(app)

// Render the initial state
renderer.render(gameState)

// Start the game loop
gameLoop.start()

// Sync regiment positions to game state for rendering
function syncRegimentsToGameState(): void {
  const units = gameState.getUnits()
  const regiments = [regiment1, regiment2, regiment3]
  
  // Update each unit's position from its corresponding regiment
  for (let i = 0; i < regiments.length; i++) {
    const regiment = regiments[i]
    const unit = units.find(u => u.id === regiment.getId())
    if (unit) {
      unit.x = regiment.getX()
      unit.y = regiment.getY()
    }
  }
}

// Add a ticker to continuously render the game state
app.ticker.add(() => {
  // Sync positions before rendering
  syncRegimentsToGameState()
  renderer.render(gameState)
})

// For demonstration: Add debug logging and a button to start simulation
console.log('Game loop started!')
console.log('Current phase:', gameState.getPhase())
console.log('Map dimensions:', gameState.getMap().getWidth(), 'x', gameState.getMap().getHeight())
console.log('Regiments created:', [regiment1, regiment2, regiment3].map(r => ({ id: r.getId(), x: r.getX(), y: r.getY() })))
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
      const moveOrder: MoveOrder = { type: 'MOVE', targetX: 10, targetY: 10 }
      regiment1.setOrder(moveOrder)
      console.log('Move order assigned to regiment-1: target (10, 10)')
      console.log('Current position:', regiment1.getX(), regiment1.getY())
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
          console.log('regiment-1 position:', regiment1.getX().toFixed(2), regiment1.getY().toFixed(2))
        }
        
        if (phase === 'PLANNING') {
          console.log('\n=== SIMULATION COMPLETED ===')
          console.log('Back to PLANNING phase')
          console.log('Final regiment-1 position:', regiment1.getX(), regiment1.getY())
          clearInterval(logInterval)
        }
      }, 100)
    }
  }
})

// Add "End Turn" button event listener
const endTurnButton = document.getElementById('end-turn-button')
if (endTurnButton) {
  endTurnButton.addEventListener('click', () => {
    if (gameState.getPhase() === 'PLANNING') {
      // Reset turn simulator before starting
      turnSimulator.reset()
      gameState.startTurn()
      console.log('\n=== Turn started via button! ===')
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
