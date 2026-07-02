import { BUILDINGS } from "../config/buildings";
import type { Grid } from "../Grid";
import type { CityStats } from "../types";

/**
 * Advances the city economy one "day" at a time. Pure aggregation over the
 * grid — no rendering, no allocation beyond the reused stats object.
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
    };
  }

  /** Recompute capacity totals (housing/jobs/upkeep) from the current grid. */
  private tally(grid: Grid): { housing: number; jobs: number; upkeep: number } {
    let housing = 0;
    let jobs = 0;
    let upkeep = 0;
    grid.forEach((tile) => {
      const def = BUILDINGS[tile.building];
      housing += def.housing;
      jobs += def.jobs;
      upkeep += def.upkeep;
    });
    return { housing, jobs, upkeep };
  }

  /** Called once per in-game day. Grows population toward capacity. */
  step(grid: Grid): void {
    const { housing, jobs, upkeep } = this.tally(grid);
    const s = this.stats;

    s.housing = housing;
    s.jobs = jobs;

    // Population migrates toward available housing, gated by nearby jobs so a
    // city of pure housing stalls — a simple demand model, easy to extend.
    const target = Math.min(housing, jobs * 2 + 20);
    s.population += Math.round((target - s.population) * 0.25);
    if (s.population < 0) s.population = 0;

    // Income: residents pay tax; commerce/industry productivity scales with
    // an employed workforce.
    const employed = Math.min(s.population, jobs);
    const taxes = s.population * 1.0;
    const productivity = employed * 1.5;
    const income = taxes + productivity;

    s.balance = Math.round(income - upkeep);
    s.credits += s.balance;
    s.day += 1;
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
