import { BUILDINGS } from "../config/buildings";
import { WORLD } from "../config/world";
import type { Grid } from "../Grid";
import type { BuildingId, CityStats } from "../types";

/** Zone kinds that require a road connection to function. */
const NEEDS_ROAD = new Set<BuildingId>([
  "residential",
  "commercial",
  "industrial",
]);

/**
 * Advances the city economy one "day" at a time. Pure aggregation over the
 * grid — no rendering, and no allocation in the hot loop beyond the reused
 * stats object.
 */
export class Simulation {
  readonly stats: CityStats;

  constructor(startingCredits: number) {
    this.stats = {
      credits: startingCredits,
      population: 0,
      jobs: 0,
      housing: 0,
      balance: 0,
      day: 0,
      employed: 0,
      disconnected: 0,
    };
  }

  /**
   * Mark every zone tile active/inactive based on road adjacency, and tally
   * capacity from the *active* buildings only. Upkeep is charged on everything
   * placed (you pay to maintain even a disconnected building), but housing and
   * jobs only count when a road connects the zone to the city.
   */
  private tally(grid: Grid): {
    housing: number;
    jobs: number;
    upkeep: number;
    disconnected: number;
  } {
    let housing = 0;
    let jobs = 0;
    let upkeep = 0;
    let disconnected = 0;

    grid.forEach((tile, coord) => {
      const def = BUILDINGS[tile.building];
      upkeep += def.upkeep;

      if (NEEDS_ROAD.has(tile.building)) {
        tile.active = this.roadAdjacent(grid, coord.x, coord.y);
        if (!tile.active) {
          disconnected += 1;
          return; // idle zone contributes no capacity
        }
      } else {
        tile.active = true;
      }

      housing += def.housing;
      jobs += def.jobs;
    });

    return { housing, jobs, upkeep, disconnected };
  }

  /** True if any orthogonal neighbour is a road tile. */
  private roadAdjacent(grid: Grid, x: number, y: number): boolean {
    return (
      grid.get(x + 1, y)?.building === "road" ||
      grid.get(x - 1, y)?.building === "road" ||
      grid.get(x, y + 1)?.building === "road" ||
      grid.get(x, y - 1)?.building === "road"
    );
  }

  /** Called once per in-game day. Grows population toward connected capacity. */
  step(grid: Grid): void {
    const { housing, jobs, upkeep, disconnected } = this.tally(grid);
    const s = this.stats;

    s.housing = housing;
    s.jobs = jobs;
    s.disconnected = disconnected;

    // Population migrates toward available housing, gated by nearby jobs so a
    // city of pure housing stalls — a simple demand model, easy to extend.
    const target = Math.min(housing, jobs * 2 + 20);
    s.population += Math.round((target - s.population) * 0.25);
    if (s.population < 0) s.population = 0;

    // Income: residents pay tax; commerce/industry productivity scales with
    // an employed workforce.
    const employed = Math.min(s.population, jobs);
    s.employed = employed;
    const taxes = s.population * 1.0;
    const productivity = employed * 1.5;
    const income = taxes + productivity;

    s.balance = Math.round(income - upkeep);
    s.credits += s.balance;
    s.day += 1;
  }

  /** Reset economy to a fresh city (grid is cleared separately). */
  reset(startingCredits: number): void {
    const s = this.stats;
    s.credits = startingCredits;
    s.population = 0;
    s.jobs = 0;
    s.housing = 0;
    s.balance = 0;
    s.day = 0;
    s.employed = 0;
    s.disconnected = 0;
  }

  /** Load a persisted stats snapshot (clamped to sane values). */
  load(snapshot: Partial<CityStats>): void {
    const s = this.stats;
    s.credits = snapshot.credits ?? WORLD.startingCredits;
    s.population = Math.max(0, snapshot.population ?? 0);
    s.day = Math.max(0, snapshot.day ?? 0);
  }

  canAfford(cost: number): boolean {
    return this.stats.credits >= cost;
  }

  spend(cost: number): void {
    this.stats.credits -= cost;
  }

  refund(amount: number): void {
    this.stats.credits += amount;
  }
}
