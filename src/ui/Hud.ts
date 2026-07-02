import { BUILDINGS, TOOLBAR } from "../game/config/buildings";
import type { BuildingId, CityStats } from "../game/types";

/**
 * Thin DOM overlay: top stat bar + bottom build toolbar. Rebuilds the stat
 * text each frame (cheap) but the toolbar buttons are created once.
 */
export class Hud {
  private readonly root: HTMLElement;
  private readonly statBar: HTMLElement;
  private readonly buttons = new Map<BuildingId, HTMLButtonElement>();
  onSelect: (id: BuildingId) => void = () => {};

  constructor(root: HTMLElement) {
    this.root = root;
    this.statBar = document.createElement("div");
    this.statBar.className = "hud-bar";
    this.root.appendChild(this.statBar);
    this.buildToolbar();
  }

  private buildToolbar(): void {
    const bar = document.createElement("div");
    bar.className = "toolbar";
    for (const id of TOOLBAR) {
      const def = BUILDINGS[id];
      const btn = document.createElement("button");
      btn.className = "tool";
      btn.innerHTML = `${def.name}<small>${
        def.cost > 0 ? "§" + def.cost : "free"
      }</small>`;
      btn.addEventListener("click", () => this.onSelect(id));
      bar.appendChild(btn);
      this.buttons.set(id, btn);
    }
    this.root.appendChild(bar);
  }

  setSelected(id: BuildingId): void {
    for (const [key, btn] of this.buttons) {
      btn.classList.toggle("active", key === id);
    }
  }

  updateStats(stats: CityStats): void {
    const money = stats.balance >= 0 ? `+§${stats.balance}` : `−§${-stats.balance}`;
    this.statBar.innerHTML = `
      ${stat("§" + Math.round(stats.credits).toLocaleString(), "Treasury")}
      ${stat(money + "/day", "Balance")}
      ${stat(stats.population.toLocaleString(), "Population")}
      ${stat(stats.jobs.toLocaleString(), "Jobs")}
      ${stat(stats.housing.toLocaleString(), "Housing")}
      ${stat("Day " + stats.day, "Time")}
    `;
  }
}

function stat(value: string, label: string): string {
  return `<div class="stat"><b>${value}</b><span>${label}</span></div>`;
}
