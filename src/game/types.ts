/** Core shared types for Atlas City. */

/** Integer tile coordinate on the map grid. */
export interface TileCoord {
  x: number;
  y: number;
}

/** Screen-space pixel point. */
export interface Point {
  x: number;
  y: number;
}

/** Identifier for a placeable building kind (keys of BUILDINGS). */
export type BuildingId =
  | "grass"
  | "road"
  | "residential"
  | "commercial"
  | "industrial"
  | "park";

/**
 * Data-driven definition of a building type. Kept as plain data (no logic)
 * so balancing/content can live in one place — see config/buildings.ts.
 */
export interface BuildingDef {
  id: BuildingId;
  name: string;
  /** Short label for the toolbar. */
  hotkey: string;
  /** One-time construction cost, in credits. */
  cost: number;
  /** Recurring upkeep per simulation day. */
  upkeep: number;
  /** Housing capacity contributed to the city. */
  housing: number;
  /** Jobs contributed to the city. */
  jobs: number;
  /** Flat fill colour used by the placeholder renderer. */
  color: string;
  /** Whether this tile can be placed by the player from the toolbar. */
  placeable: boolean;
}

/** A single cell of the city grid. */
export interface Tile {
  building: BuildingId;
  /**
   * Whether this building is road-connected and therefore economically
   * active. Recomputed each simulation day; roads/parks/grass are always
   * active, zones require adjacency to the road network.
   */
  active: boolean;
}

/** Snapshot of city-wide simulation figures shown in the HUD. */
export interface CityStats {
  credits: number;
  population: number;
  jobs: number;
  housing: number;
  /** Net credits per simulation day (income − upkeep). */
  balance: number;
  day: number;
  /** Employed residents (min of population and connected jobs). */
  employed: number;
  /** Count of placed zones that are not road-connected (idle). */
  disconnected: number;
}

/** Lifecycle of a play session — drives win/lose UI. */
export type GamePhase = "playing" | "bankrupt";
