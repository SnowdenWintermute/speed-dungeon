import { AnalysisSampleDimensions } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleRunSetResult } from "../../analysis-runs/run-set.ts";
import { AccuracyBySource } from "./run-reporter.ts";

/** One denormalized row per run, room and character. */
export interface MaxAccuracySample extends AnalysisSampleDimensions {
  totalAccuracy: number;
  accuracyBySource: AccuracyBySource;
}

export type MaxAccuracyRunSetResult = AnalysisSampleRunSetResult<MaxAccuracySample>;
