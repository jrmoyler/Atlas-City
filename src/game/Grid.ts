import type { BuildingId, Tile, TileCoord } from "./types";

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
      this.tiles[i] = { building: "grass" };
    }
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
