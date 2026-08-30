import type { SampledDamageRunSetResult } from "../studies/sampled-damage/samples.ts";
import type { MaxAccuracyRunSetResult } from "../studies/max-accuracy/samples.ts";
import type { ArmorClassRunSetResult } from "../studies/armor-class/samples.ts";
import type { AnalysisRunSetResult } from "./run-set.ts";

export enum DungeonRunAnalysis {
  MaxAccuracy,
  SampledDamage,
  ArmorClass,
}

// import type above, not a plain import: the workbook sync reaches this module and has no reason to
// load a study's reporting machinery to read a spreadsheet
/** the registry the worker and the hook are generic over: an analysis is its enum member plus its result */
export interface DungeonRunAnalysisResults
  extends Record<DungeonRunAnalysis, AnalysisRunSetResult> {
  [DungeonRunAnalysis.MaxAccuracy]: MaxAccuracyRunSetResult;
  [DungeonRunAnalysis.SampledDamage]: SampledDamageRunSetResult;
  [DungeonRunAnalysis.ArmorClass]: ArmorClassRunSetResult;
}
