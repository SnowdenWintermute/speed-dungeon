import { AnalysisSampleDimensions } from "@/analysis-runs/analysis-sample";
import { RoomAvailability } from "@/analysis-runs/room-availability";
import { AnalysisRunSetResult } from "@/analysis-runs/run-set";
import { AccuracyBySource } from "./run-reporter";

/** One denormalized row per run, room and character. */
export interface MaxAccuracySample extends AnalysisSampleDimensions {
  totalAccuracy: number;
  accuracyBySource: AccuracyBySource;
}

export interface MaxAccuracyRunSetResult extends AnalysisRunSetResult {
  samples: MaxAccuracySample[];
  availability: RoomAvailability[];
}
