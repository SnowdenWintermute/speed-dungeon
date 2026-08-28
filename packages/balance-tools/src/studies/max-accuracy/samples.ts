import { AnalysisSampleDimensions } from "@/analysis-runs/analysis-sample";
import { AnalysisSampleRunSetResult } from "@/analysis-runs/run-set";
import { AccuracyBySource } from "./run-reporter";

/** One denormalized row per run, room and character. */
export interface MaxAccuracySample extends AnalysisSampleDimensions {
  totalAccuracy: number;
  accuracyBySource: AccuracyBySource;
}

export type MaxAccuracyRunSetResult = AnalysisSampleRunSetResult<MaxAccuracySample>;
