import type { BuildingId, Tile, TileCoord } from "./types";

/** Single-char save codes, stable across versions (append-only). */
const BUILDING_CODE: Record<BuildingId, string> = {
  grass: ".",
  road: "r",
  residential: "h",
  commercial: "c",
  industrial: "i",
  park: "p",
};
const CODE_BUILDING: Record<string, BuildingId> = Object.fromEntries(
  Object.entries(BUILDING_CODE).map(([k, v]) => [v, k as BuildingId]),
) as Record<string, BuildingId>;

/**
 * The city map: a dense row-major array of tiles. Fixed size, allocated once,
 * so the simulation/render hot loops never allocate (a skill MUST DO).
 */
export class Grid {
  readonly cols: number;
  readonly rows: number;
  private readonly tiles: Tile[];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = new Array(cols * rows);
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i] = { building: "grass", active: true };
    }
  }

  /** Reset every tile back to bare grass (allocation-free — mutates in place). */
  clear(): void {
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].building = "grass";
      this.tiles[i].active = true;
    }
  }

  /**
   * Serialize buildings to a compact row-major string (one char per tile) for
   * localStorage. Only the building matters; `active` is derived on load.
   */
  serialize(): string {
    let out = "";
    for (let i = 0; i < this.tiles.length; i++) {
      out += BUILDING_CODE[this.tiles[i].building];
    }
    return out;
  }

  /** Restore from a {@link serialize} string. Returns false if it doesn't fit. */
  deserialize(data: string): boolean {
    if (data.length !== this.tiles.length) return false;
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].building = CODE_BUILDING[data[i]] ?? "grass";
      this.tiles[i].active = true;
    }
    return true;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  private index(x: number, y: number): number {
    return y * this.cols + x;
  }

  get(x: number, y: number): Tile | undefined {
    return this.inBounds(x, y) ? this.tiles[this.index(x, y)] : undefined;
  }

  set(x: number, y: number, building: BuildingId): boolean {
    if (!this.inBounds(x, y)) return false;
    this.tiles[this.index(x, y)].building = building;
    return true;
  }

  /** Iterate every tile in draw order (back-to-front handled by caller). */
  forEach(fn: (tile: Tile, coord: TileCoord) => void): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        fn(this.tiles[this.index(x, y)], { x, y });
      }
    }
  }
}
