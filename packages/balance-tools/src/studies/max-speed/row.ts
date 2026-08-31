import { AnalysisTableRow } from "../../analysis-runs/analysis-sample-table.ts";
import { AgilityBySource } from "./run-reporter.ts";

export interface MaxSpeedTableRow extends AnalysisTableRow {
  /**
   * Means, so the three read against each other. The agility and speed totals they attribute are on
   * `totalAttributes`, which carries a median as well, so these will not re-sum to it.
   */
  averageAgilityBySource: AgilityBySource;
}
