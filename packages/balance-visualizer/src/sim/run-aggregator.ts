import { CombatantClass } from "@speed-dungeon/common";
import { RoomVisit } from "./run-history";

/** Consumes walks one at a time so a caller can discard each one as it finishes. Retaining every
 * RoomVisit across a few hundred runs would mean holding a cloned combatant per character per room
 * per run. */
export interface RunAggregator<TResult> {
  /** The party to walk the next run with, asked for before every run so an analysis can vary it.
   * Required rather than optional: an analysis that re-draws its party each run and one that fixes
   * it are answering different questions, and which it is should be visible at the analysis. */
  nextPartyClasses(): CombatantClass[];
  collectRun(visits: RoomVisit[]): void;
  assemble(): TResult;
}
