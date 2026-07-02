/** Population goals that give the sandbox a sense of progression. */
export interface Milestone {
  population: number;
  title: string;
}

/** Ordered ascending; the game announces each as it's first reached. */
export const MILESTONES: Milestone[] = [
  { population: 50, title: "Village — 50 residents" },
  { population: 150, title: "Town — 150 residents" },
  { population: 400, title: "Small City — 400 residents" },
  { population: 1000, title: "City — 1,000 residents" },
  { population: 2500, title: "Metropolis — 2,500 residents" },
];
