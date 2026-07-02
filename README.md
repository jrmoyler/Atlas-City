# Atlas City

An isometric **city-builder** game for the web, written in TypeScript with a
zero-asset Canvas renderer. Place zones, watch population and the economy
respond in real time, and grow a city.

> **Status: playable.** A running core with a real game loop — place/bulldoze,
> road-connected economy, population milestones, a bankruptcy lose state,
> autosave, and placement feedback. Not "finished," but a genuine game you can
> sit down and play. See [`ROADMAP.md`](./ROADMAP.md) for what's next.

## What's in the game

- **Zoning that matters** — housing, shops, and industry only earn income when
  connected to the **road network**; disconnected zones grey out with a "no
  road" warning and contribute nothing until you link them.
- **Living economy** — population migrates toward connected housing, gated by
  available jobs; employed residents drive productivity and tax income.
- **Goals & failure** — population **milestones** (Village → Metropolis) are
  announced as you hit them; run the treasury below zero and you go **bankrupt**.
- **Save/load** — the city autosaves to `localStorage` every few days (and on
  exit); **New City** starts fresh.
- **Feel** — translucent placement preview (valid/invalid), a day↔night sky
  cycle, and toast notifications for milestones and warnings.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck (tsc --noEmit) + production build to dist/
npm run preview    # serve the production build
npm run typecheck  # types only
```

## Controls

| Action | Input |
| --- | --- |
| Select a build tool | Toolbar buttons, or number keys `0`–`5` |
| Place building | Left click a tile |
| Bulldoze | Select **Bulldoze** (`0`), then click |
| Pan | Right/middle-drag, or left-drag past a few px |
| Zoom | Mouse wheel, or two-finger pinch (touch) |
| Save / New City | Buttons, top-right |

**Tip:** lay a **Road** first, then place housing/shops/industry *next to it* —
a zone with no adjacent road stays idle (greyed, amber dot) and earns nothing.

## How it's built

The code separates **simulation** from **rendering** so the game logic never
depends on how (or whether) it's drawn — you can swap the placeholder Canvas
renderer for sprites or Three.js without touching the economy.

```
src/
  main.ts                 Bootstrap: wires DOM → Game
  game/
    Game.ts               Fixed-timestep loop; owns all systems
    Grid.ts               Dense tile map (allocated once, no hot-loop GC)
    Camera.ts             Pan/zoom + isometric ⇆ screen transforms
    types.ts              Shared types
    config/
      buildings.ts        Data-driven building/balance table (edit here)
      world.ts            Map size, tile size, economy constants
      milestones.ts       Population goals announced during play
    systems/
      Simulation.ts       Economy: connectivity, population, jobs, income
      Renderer.ts         Isometric Canvas renderer + preview / day-night
      Input.ts            Pointer/keyboard: place, pan, zoom, pinch
      Persistence.ts      localStorage save/load (compact grid encoding)
  ui/
    Hud.ts                DOM overlay: stats, toolbar, menu, toast stack
```

### Design notes

The architecture follows patterns from the installed `game-developer` skill,
adapted from Unity/Unreal to the web:

- **Fixed-timestep simulation** decoupled from a variable-rate render loop, so
  the economy is deterministic regardless of frame rate.
- **Data-driven content** — all balance values live in `config/`, not scattered
  through logic.
- **No allocation in hot loops** — the grid and stats objects are allocated once
  and mutated in place.

To add a building type, add one entry to `BUILDINGS` in
`src/game/config/buildings.ts` and list it in `TOOLBAR`. No other code changes.

## License

MIT
