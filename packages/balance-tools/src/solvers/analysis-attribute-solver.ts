/** what decides a party's attributes when it enters a room, whether it earns them or copies them */
export interface AnalysisAttributeSolver {
  /** mutates combatants in place */
  solve(): void;
}
