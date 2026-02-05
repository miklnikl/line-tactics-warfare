import { Application, Graphics } from 'pixi.js'
import { GameState } from './game/GameState.ts'
import { TurnSimulator } from './game/TurnSimulator.ts'
import { GameLoop } from './game/GameLoop.ts'

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

// Create a simple rectangle
const rectangle = new Graphics()
  .rect(100, 100, 200, 150)
  .fill(0xff0000)

// Add the rectangle to the stage
app.stage.addChild(rectangle)

// Initialize game logic (independent of PixiJS)
const gameState = new GameState()
const turnSimulator = new TurnSimulator()
const gameLoop = new GameLoop(gameState, turnSimulator)

// Start the game loop
gameLoop.start()

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
