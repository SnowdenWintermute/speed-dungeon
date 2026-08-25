import { CombatantId, Equipment } from "@speed-dungeon/common";

export type RunReport<T> = { floor: number; room: number; roomReport: T }[];

export interface AnalysisRunReporter<T> {
  updateReport(
    goalPerformanceByCharacter: Map<CombatantId, number>,
    equipmentDroppedThisRoom: Equipment[]
  ): void;
  runReport: RunReport<T>;
}
