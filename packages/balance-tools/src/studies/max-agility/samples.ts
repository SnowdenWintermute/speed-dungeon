import { AnalysisSampleDimensions } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleRunSetResult } from "../../analysis-runs/run-set.ts";
import { AgilityBySource } from "./run-reporter.ts";

/** One denormalized row per run, room and character. The agility total itself is on
 * the dimensions every sample carries, so only the attribution is added here. */
export interface MaxAgilitySample extends AnalysisSampleDimensions {
  agilityBySource: AgilityBySource;
}

export type MaxAgilityRunSetResult = AnalysisSampleRunSetResult<MaxAgilitySample>;
