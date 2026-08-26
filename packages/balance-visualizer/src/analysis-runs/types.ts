import { AttackDamageRunSetResult } from "@/studies/attack-damage/samples";
import { MaxAccuracyRunSetResult } from "@/studies/max-accuracy/samples";
import { AnalysisRunSetResult } from "./run-set";

export enum DungeonRunAnalysis {
  MaxAccuracy,
  AttackDamage,
}

/** the registry the worker and the hook are generic over: a study is its enum member plus its result */
export interface DungeonRunAnalysisResults
  extends Record<DungeonRunAnalysis, AnalysisRunSetResult> {
  [DungeonRunAnalysis.MaxAccuracy]: MaxAccuracyRunSetResult;
  [DungeonRunAnalysis.AttackDamage]: AttackDamageRunSetResult;
}

export const DUNGEON_RUN_ANALYSIS_NAMES: Record<DungeonRunAnalysis, string> = {
  [DungeonRunAnalysis.MaxAccuracy]: "Max accuracy",
  [DungeonRunAnalysis.AttackDamage]: "Attack damage",
};
