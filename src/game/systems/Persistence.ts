import { WORLD } from "../config/world";
import type { Grid } from "../Grid";
import type { Simulation } from "./Simulation";

const KEY = "atlas-city.save.v1";
const VERSION = 1;

interface SaveData {
  version: number;
  cols: number;
  rows: number;
  tiles: string;
  credits: number;
  population: number;
  day: number;
  milestoneIndex: number;
}

/**
 * localStorage-backed save/load. Deliberately tiny and forgiving: a corrupt or
 * mismatched save is ignored rather than crashing the game.
 */
export const Persistence = {
  save(grid: Grid, sim: Simulation, milestoneIndex: number): boolean {
    try {
      const data: SaveData = {
        version: VERSION,
        cols: grid.cols,
        rows: grid.rows,
        tiles: grid.serialize(),
        credits: Math.round(sim.stats.credits),
        population: sim.stats.population,
        day: sim.stats.day,
        milestoneIndex,
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false; // storage full / disabled — fail quietly
    }
  },

  /** Returns the loaded milestone index, or null if nothing valid was loaded. */
  load(grid: Grid, sim: Simulation): number | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (
        data.version !== VERSION ||
        data.cols !== grid.cols ||
        data.rows !== grid.rows
      ) {
        return null;
      }
      if (!grid.deserialize(data.tiles)) return null;
      sim.load({
        credits: data.credits ?? WORLD.startingCredits,
        population: data.population ?? 0,
        day: data.day ?? 0,
      });
      return data.milestoneIndex ?? 0;
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
