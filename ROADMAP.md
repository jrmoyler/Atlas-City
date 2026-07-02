# Atlas City — Roadmap

An honest plan from "running scaffold" toward a polished, shippable game. This
is intentionally realistic: a browser city-builder built and iterated here, not
a AAA console title (which requires a large team, years, and a licensed engine —
out of scope for this environment). A focused, well-made web game is a genuine,
achievable goal.

## ✅ Phase 0 — Scaffold (done)

- Vite + strict TypeScript project that builds clean.
- Isometric Canvas renderer (placeholder art, zero assets).
- Dense tile grid; pan / zoom / pinch camera.
- Place & bulldoze from a toolbar (mouse + hotkeys).
- Fixed-timestep economy: population, jobs, housing, income, upkeep, treasury.
- Live HUD; verified running end-to-end in a headless browser.

## Phase 1 — A real game loop

- **Demand model**: separate residential/commercial/industrial demand so zoning
  choices matter; unemployment and vacancy feedback.
- **Roads & connectivity**: buildings only function when road-connected; simple
  pathfinding/flood-fill for service coverage.
- **Services**: power, water, and their networks as a build constraint.
- **Win/lose & goals**: milestones (population tiers), bankruptcy loss state.
- **Save/load**: serialize the grid + stats to `localStorage`.

## Phase 2 — Feel & polish

- Placement preview (ghost tile, affordability/validity highlight).
- Sound + music (Web Audio); day/night tint cycle.
- Particle/tween juice on build & income; number roll-ups in the HUD.
- Better placeholder art → sprite atlas, or migrate the renderer to Three.js /
  WebGL for real 3D depth and lighting.
- Tutorial / onboarding overlay.

## Phase 3 — Quality & content

- Automated tests for the simulation (deterministic steps make this easy).
- Playtest-driven balance passes on `config/`.
- More building tiers, unique buildings, disasters/events.
- Performance profiling on large maps (target 60 FPS).
- Accessibility: colorblind-safe palette, scalable UI, keyboard-only play.

## Phase 4 — Distribution

- **Web**: deploy the static `dist/` (Vercel/Netlify/GitHub Pages) — playable
  by URL immediately.
- **App stores (later)**: wrap the web build with
  [Capacitor](https://capacitorjs.com/) into iOS/Android shells. This is the
  realistic native path from a web game; it does **not** turn it into a native
  engine title. Store submission needs an Apple Developer account, icons/splash,
  privacy disclosures, and review — a checklist we can work through when the game
  itself is ready.

## Not planned (and why)

- **Unreal / Unity / native C++ engine port** — a different tech stack and team
  scale; not buildable or runnable in this environment.
- **"AAA" production values** — a budget/team category, not a feature list. We
  aim instead for *polished and genuinely fun within scope*.
