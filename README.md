# Atlas City

An isometric **city-builder** game for the web, written in TypeScript with a
zero-asset Canvas renderer. Place zones, watch population and the economy
respond in real time, and grow a city.

> **Status: early scaffold.** This is a clean, running foundation — a real
> playable core (place/bulldoze, live economy simulation, pan/zoom/HUD), not a
> finished game. See [`ROADMAP.md`](./ROADMAP.md) for what's next.

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
    systems/
      Simulation.ts       Economy: population, jobs, income, upkeep
      Renderer.ts         Placeholder isometric Canvas renderer
      Input.ts            Pointer/keyboard: place, pan, zoom, pinch
  ui/
    Hud.ts                DOM overlay: stat bar + build toolbar
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
