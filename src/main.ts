import { Application, Graphics } from 'pixi.js'

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
