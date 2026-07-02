/** World-level constants for the map and isometric projection. */
export const WORLD = {
  /** Grid dimensions in tiles. */
  cols: 32,
  rows: 32,

  /** Isometric tile footprint in pixels (2:1 diamond). */
  tileWidth: 64,
  tileHeight: 32,

  /** Starting treasury. */
  startingCredits: 2000,

  /** Real seconds per in-game simulation day. */
  secondsPerDay: 2,
} as const;
