import { Application } from 'pixi.js'
import { GameState } from './game/GameState.ts'
import { TurnSimulator } from './game/TurnSimulator.ts'
import { GameLoop } from './game/GameLoop.ts'
import { PixiRenderer } from './renderer/PixiRenderer.ts'

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

// Initialize game logic (independent of PixiJS)
const gameState = new GameState()
const turnSimulator = new TurnSimulator()
const gameLoop = new GameLoop(gameState, turnSimulator)

// Initialize the renderer
const renderer = new PixiRenderer(app)

// Add some test units to the game state
gameState.addUnit({ id: 'unit-1', x: 2, y: 3 })
gameState.addUnit({ id: 'unit-2', x: 5, y: 5 })
gameState.addUnit({ id: 'unit-3', x: 8, y: 2 })

// Render the initial state
renderer.render(gameState)

// Start the game loop
gameLoop.start()

// Add a ticker to continuously render the game state
app.ticker.add(() => {
  renderer.render(gameState)
})

// For demonstration: Add debug logging and a button to start simulation
console.log('Game loop started!')
console.log('Current phase:', gameState.getPhase())
console.log('Press "S" to start simulation phase')

// Add keyboard event to start simulation for testing
document.addEventListener('keydown', (event) => {
  if (event.key === 's' || event.key === 'S') {
    if (gameState.getPhase() === 'PLANNING') {
      gameState.startTurn()
      console.log('Simulation started! Current phase:', gameState.getPhase())
      console.log('Turn will run for', TurnSimulator.getTicksPerTurn(), 'ticks')
      
      // Log progress periodically
      const logInterval = setInterval(() => {
        const tick = turnSimulator.getCurrentTick()
        console.log('Tick:', tick, '/', TurnSimulator.getTicksPerTurn())
        
        if (gameState.getPhase() === 'PLANNING') {
          console.log('Simulation completed! Back to planning phase.')
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
      gameState.startTurn()
      console.log('Turn started via button! Current phase:', gameState.getPhase())
    }
  })
}
