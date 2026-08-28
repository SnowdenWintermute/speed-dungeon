import { AnalysisTableRow } from "@/analysis-runs/analysis-sample-table";
import { Distribution } from "@/statistics/distribution";
import { AccuracyBySource } from "./run-reporter";

export interface MaxAccuracyTableRow extends AnalysisTableRow {
  /** the most accuracy the solvers could assemble for a character standing in this room */
  totalAccuracy: Distribution;
  /** loot driven, so read the median of it rather than the mean */
  accuracyFromEquipment: Distribution;
  /**
   * Means, so the four read against each other. The two gear terms are means where
   * accuracyFromEquipment is a median, so they do not add up to it.
   */
  averageAccuracyBySource: AccuracyBySource;
}
