import type { BuildingDef, BuildingId } from "../types";

/**
 * Central content/balance table. All tunable values live here rather than
 * being hardcoded across systems (a data-driven design the game-developer
 * skill flags as a MUST DO). Add a new building by adding one entry.
 */
export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  grass: {
    id: "grass",
    name: "Bulldoze",
    hotkey: "0",
    cost: 0,
    upkeep: 0,
    housing: 0,
    jobs: 0,
    color: "#2f7d4f",
    placeable: true,
  },
  road: {
    id: "road",
    name: "Road",
    hotkey: "1",
    cost: 10,
    upkeep: 1,
    housing: 0,
    jobs: 0,
    color: "#4a4f5c",
    placeable: true,
  },
  residential: {
    id: "residential",
    name: "Housing",
    hotkey: "2",
    cost: 100,
    upkeep: 2,
    housing: 12,
    jobs: 0,
    color: "#3d7fd6",
    placeable: true,
  },
  commercial: {
    id: "commercial",
    name: "Shops",
    hotkey: "3",
    cost: 140,
    upkeep: 3,
    housing: 0,
    jobs: 8,
    color: "#d6a83d",
    placeable: true,
  },
  industrial: {
    id: "industrial",
    name: "Industry",
    hotkey: "4",
    cost: 180,
    upkeep: 4,
    housing: 0,
    jobs: 14,
    color: "#b5622f",
    placeable: true,
  },
  park: {
    id: "park",
    name: "Park",
    hotkey: "5",
    cost: 60,
    upkeep: 1,
    housing: 0,
    jobs: 0,
    color: "#57b85a",
    placeable: true,
  },
};

/** Toolbar order (the empty-tile "grass" is the bulldoze tool). */
export const TOOLBAR: BuildingId[] = [
  "grass",
  "road",
  "residential",
  "commercial",
  "industrial",
  "park",
];
