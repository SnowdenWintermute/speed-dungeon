import { RoomVisit } from "./run-history";

/** Consumes walks one at a time so a caller can discard each one as it finishes. Retaining every
 * RoomVisit across a few hundred runs would mean holding a cloned combatant per character per room
 * per run. */
export interface RunAggregator<TResult> {
  collectRun(visits: RoomVisit[]): void;
  assemble(): TResult;
}
