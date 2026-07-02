import { BUILDINGS } from "./config/buildings";
import { MILESTONES } from "./config/milestones";
import { WORLD } from "./config/world";
import { Camera } from "./Camera";
import { Grid } from "./Grid";
import { Input } from "./systems/Input";
import { Persistence } from "./systems/Persistence";
import { Renderer, type Preview } from "./systems/Renderer";
import { Simulation } from "./systems/Simulation";
import type { BuildingId, GamePhase, TileCoord } from "./types";
import { Hud } from "../ui/Hud";

/** Real seconds for a full day↔night cycle (purely cosmetic tint). */
const DAY_CYCLE_SECONDS = 30;
/** Treasury below this ends the run. */
const BANKRUPT_AT = -1000;
/** Autosave cadence, in simulation days. */
const AUTOSAVE_EVERY = 5;

/**
 * Top-level orchestrator. Runs a fixed-timestep simulation decoupled from a
 * variable-rate render (the classic loop the game-developer skill prescribes):
 * the economy advances in deterministic day-steps while rendering interpolates
 * to the display refresh via requestAnimationFrame.
 */
export class Game {
  private readonly grid = new Grid(WORLD.cols, WORLD.rows);
  private readonly camera = new Camera();
  private readonly sim = new Simulation(WORLD.startingCredits);
  private readonly renderer: Renderer;
  private readonly input: Input;
  private readonly hud: Hud;

  private selected: BuildingId = "residential";
  private accumulator = 0;
  private lastTime = 0;
  private clock = 0;
  private running = false;

  private phase: GamePhase = "playing";
  private milestoneIndex = 0;
  private lowFundsWarned = false;

  constructor(canvas: HTMLCanvasElement, hudRoot: HTMLElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas, this.camera);
    this.hud = new Hud(hudRoot);

    this.input.onPlace = (t) => this.place(t);
    this.input.onHotkey = (k) => this.handleHotkey(k);
    this.hud.onSelect = (id) => this.select(id);
    this.hud.onReset = () => this.reset();
    this.hud.onSave = () => this.saveNow();

    // Restore a prior city if one is saved.
    const loaded = Persistence.load(this.grid, this.sim);
    if (loaded !== null) {
      this.milestoneIndex = loaded;
    }

    this.resize();
    this.camera.centerOn(canvas.clientWidth, canvas.clientHeight);
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("beforeunload", () => this.saveNow(true));

    this.select(this.selected);
    this.hud.updateStats(this.sim.stats);
    this.hud.updateAffordability(this.sim.stats.credits);
    if (loaded !== null) {
      this.hud.notify(`Loaded day ${this.sim.stats.day}`, "info");
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  private resize(): void {
    this.renderer.resize();
  }

  private select(id: BuildingId): void {
    this.selected = id;
    this.hud.setSelected(id);
  }

  private handleHotkey(key: string): void {
    for (const def of Object.values(BUILDINGS)) {
      if (def.hotkey === key) {
        this.select(def.id);
        return;
      }
    }
  }

  /** Attempt to place/bulldoze the currently selected building on a tile. */
  private place(t: TileCoord): void {
    if (this.phase !== "playing") return;
    const tile = this.grid.get(t.x, t.y);
    if (!tile) return;
    const def = BUILDINGS[this.selected];

    if (this.selected === "grass") {
      // Bulldoze: refund a fraction of the removed building's cost.
      const removed = BUILDINGS[tile.building];
      this.grid.set(t.x, t.y, "grass");
      this.sim.refund(Math.floor(removed.cost * 0.25));
      this.hud.updateAffordability(this.sim.stats.credits);
      return;
    }

    if (tile.building !== "grass") return; // occupied
    if (!this.sim.canAfford(def.cost)) {
      this.hud.notify(`Not enough credits for ${def.name}`, "warn");
      return;
    }

    this.sim.spend(def.cost);
    this.grid.set(t.x, t.y, def.id);
    this.hud.updateAffordability(this.sim.stats.credits);
  }

  /** Build the translucent placement hint under the cursor, if any. */
  private previewAt(): Preview | null {
    const hover = this.input.hover;
    if (!hover || this.phase !== "playing") return null;
    if (!this.grid.inBounds(hover.x, hover.y)) return null;
    if (this.selected === "grass") return null; // bulldoze has no ghost
    const tile = this.grid.get(hover.x, hover.y);
    if (!tile) return null;
    const def = BUILDINGS[this.selected];
    const valid = tile.building === "grass" && this.sim.canAfford(def.cost);
    return { coord: hover, building: this.selected, valid };
  }

  private saveNow(silent = false): void {
    const ok = Persistence.save(this.grid, this.sim, this.milestoneIndex);
    if (!silent) this.hud.notify(ok ? "City saved" : "Save failed", ok ? "success" : "warn");
  }

  private reset(): void {
    this.grid.clear();
    this.sim.reset(WORLD.startingCredits);
    Persistence.clear();
    this.milestoneIndex = 0;
    this.lowFundsWarned = false;
    this.phase = "playing";
    this.hud.updateStats(this.sim.stats);
    this.hud.updateAffordability(this.sim.stats.credits);
    this.hud.notify("New city — treasury reset", "info");
  }

  /** Post-day checks: milestones, low-funds warning, bankruptcy, autosave. */
  private onDayAdvanced(): void {
    const s = this.sim.stats;

    while (
      this.milestoneIndex < MILESTONES.length &&
      s.population >= MILESTONES[this.milestoneIndex].population
    ) {
      this.hud.notify(`Milestone: ${MILESTONES[this.milestoneIndex].title}`, "success");
      this.milestoneIndex += 1;
    }

    if (!this.lowFundsWarned && s.credits < 200 && s.balance < 0) {
      this.lowFundsWarned = true;
      this.hud.notify("Treasury running low — raise income or cut upkeep", "warn");
    } else if (s.credits > 500) {
      this.lowFundsWarned = false;
    }

    if (s.credits < BANKRUPT_AT) {
      this.phase = "bankrupt";
      this.hud.notify("Bankrupt! Starting a fresh city…", "warn");
      window.setTimeout(() => this.reset(), 2500);
      return;
    }

    if (s.day % AUTOSAVE_EVERY === 0) {
      Persistence.save(this.grid, this.sim, this.milestoneIndex);
    }

    // Income/upkeep changed the treasury — refresh which tools are affordable.
    this.hud.updateAffordability(s.credits);
  }

  /** Fixed-timestep loop driver. */
  private frame = (now: number): void => {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Guard against huge steps after a tab is backgrounded.
    if (dt > 0.25) dt = 0.25;
    this.clock += dt;

    this.accumulator += dt;
    const stepDuration = WORLD.secondsPerDay;
    while (this.accumulator >= stepDuration) {
      if (this.phase === "playing") {
        this.sim.step(this.grid);
        this.onDayAdvanced();
      }
      this.accumulator -= stepDuration;
    }

    this.hud.updateStats(this.sim.stats);
    const dayPhase = (this.clock / DAY_CYCLE_SECONDS) % 1;
    this.renderer.render(this.grid, this.camera, this.input.hover, this.previewAt(), dayPhase);
    requestAnimationFrame(this.frame);
  };
}
