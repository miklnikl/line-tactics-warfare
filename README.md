# line-tactics-warfare

A prototype **WEGO (We-Go) isometric tactical strategy game** inspired by the Napoleonic Wars.

The player issues orders to regiments during a planning phase, then executes all orders simultaneously during a fixed-length simulation phase.  
The focus is on formations, positioning, morale, and deterministic simulation rather than real-time micromanagement.

---

## Core Concept

- **Genre:** Tactical strategy
- **Camera:** 2D isometric
- **Turn System:** WEGO (simultaneous turns)
- **Setting:** Napoleonic era battles
- **Platform:** Web (PWA-ready)

---

## WEGO Rules (Fixed Design Contract)

- The game alternates between two phases:
  - **PLANNING:** Player assigns orders to units
  - **SIMULATION:** All orders are executed simultaneously
- Each turn consists of a fixed number of simulation ticks
- Orders are immutable once the simulation starts
- Game logic is deterministic and replayable

---

## Tech Stack

- **TypeScript** — core game logic
- **PixiJS** — 2D rendering (WebGL)
- **Vite** — development and build tooling
- **HTML/CSS** — minimal UI (no React)
- **PWA (planned)** — offline support and installability

---

## Project Architecture

The project follows a strict separation of concerns.

```text
src/
├─ game/        # Pure game logic (no rendering, no DOM)
│  ├─ GameState.ts
│  ├─ TurnSimulator.ts
│  ├─ Regiment.ts
│  ├─ Order.ts
│  └─ Map.ts
├─ render/      # PixiJS rendering only
│  ├─ PixiRenderer.ts
│  └─ Iso.ts
├─ ui/          # UI & input handling
│  ├─ ui.ts
│  └─ input.ts
├─ main.ts      # Application entry point
└─ style.css
```

## Design Rules

- Game logic **must not** depend on PixiJS, DOM, or browser APIs
- Renderer **must not** mutate game state
- UI only issues commands and reads state
- All simulation happens in fixed ticks

---

## Development Setup

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### The game will be available at:

```bash
http://localhost:5173
```
