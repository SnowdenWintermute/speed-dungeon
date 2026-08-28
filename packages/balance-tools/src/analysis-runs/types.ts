import { AttackDamageRunSetResult } from "@/studies/attack-damage/samples";
import { MaxAccuracyRunSetResult } from "@/studies/max-accuracy/samples";
import { DungeonRunAnalysis } from "./dungeon-run-analysis";
import { AnalysisRunSetResult } from "./run-set";

/** the registry the worker and the hook are generic over: a study is its enum member plus its result */
export interface DungeonRunAnalysisResults
  extends Record<DungeonRunAnalysis, AnalysisRunSetResult> {
  [DungeonRunAnalysis.MaxAccuracy]: MaxAccuracyRunSetResult;
  [DungeonRunAnalysis.AttackDamage]: AttackDamageRunSetResult;
}
