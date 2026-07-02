import { BUILDINGS } from "./config/buildings";
import { WORLD } from "./config/world";
import { Camera } from "./Camera";
import { Grid } from "./Grid";
import { Input } from "./systems/Input";
import { Renderer } from "./systems/Renderer";
import { Simulation } from "./systems/Simulation";
import type { BuildingId, TileCoord } from "./types";
import { Hud } from "../ui/Hud";

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
  private running = false;

  constructor(canvas: HTMLCanvasElement, hudRoot: HTMLElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas, this.camera);
    this.hud = new Hud(hudRoot);

    this.input.onPlace = (t) => this.place(t);
    this.input.onHotkey = (k) => this.handleHotkey(k);
    this.hud.onSelect = (id) => this.select(id);

    this.resize();
    this.camera.centerOn(canvas.clientWidth, canvas.clientHeight);
    window.addEventListener("resize", () => this.resize());

    this.select(this.selected);
    this.hud.updateStats(this.sim.stats);
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
    const tile = this.grid.get(t.x, t.y);
    if (!tile) return;
    const def = BUILDINGS[this.selected];

    if (this.selected === "grass") {
      // Bulldoze: refund a fraction of the removed building's cost.
      const removed = BUILDINGS[tile.building];
      this.grid.set(t.x, t.y, "grass");
      this.sim.refund(Math.floor(removed.cost * 0.25));
      return;
    }

    if (tile.building !== "grass") return; // occupied
    if (!this.sim.canAfford(def.cost)) return;

    this.sim.spend(def.cost);
    this.grid.set(t.x, t.y, def.id);
  }

  /** Fixed-timestep loop driver. */
  private frame = (now: number): void => {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Guard against huge steps after a tab is backgrounded.
    if (dt > 0.25) dt = 0.25;

    this.accumulator += dt;
    const stepDuration = WORLD.secondsPerDay;
    while (this.accumulator >= stepDuration) {
      this.sim.step(this.grid);
      this.accumulator -= stepDuration;
    }

    this.hud.updateStats(this.sim.stats);
    this.renderer.render(this.grid, this.camera, this.input.hover);
    requestAnimationFrame(this.frame);
  };
}
