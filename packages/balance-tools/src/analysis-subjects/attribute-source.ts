import type { CombatAttribute } from "@speed-dungeon/common";
import type { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import type { StudyName } from "../studies/study-name.ts";

export enum AttributeSourceType {
  AllocatedTowardGoal,
  CopiedFromStudyTable,
}

export interface CopiedAttributeProfileRoom {
  floor: number;
  room: number;
  /** every attribute the copied build had here except armor class, which is what gets measured */
  attributes: Partial<Record<CombatAttribute, number>>;
}

/** copying is for a goal that cannot be allocated toward: armor class comes off equipment alone, so
 * what decides an armor character's numbers is what a real build was allowed to wear */
export type AttributeSource =
  | { type: AttributeSourceType.AllocatedTowardGoal }
  | {
      type: AttributeSourceType.CopiedFromStudyTable;
      studyName: StudyName;
      slice: AnalysisSlice;
      /** filled in from that study's saved run before a set is posted to the worker */
      rooms: CopiedAttributeProfileRoom[];
    };

export const ALLOCATED_TOWARD_GOAL: AttributeSource = {
  type: AttributeSourceType.AllocatedTowardGoal,
};
