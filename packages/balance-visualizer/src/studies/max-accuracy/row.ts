import { HoldableAndPercent } from "@/analysis-subjects/equipment-base-item-tally";
import { Distribution } from "@/statistics/distribution";
import { AccuracyBySource } from "./run-reporter";

export interface MaxAccuracyTableRow {
  floor: number;
  room: number;
  /** the most accuracy the solvers could assemble for a character standing in this room */
  totalAccuracy: Distribution;
  /** loot driven, so read the median of it rather than the mean */
  accuracyFromEquipment: Distribution;
  /**
   * Means, so the four read against each other. The two gear terms are means where
   * accuracyFromEquipment is a median, so they do not add up to it.
   */
  averageAccuracyBySource: AccuracyBySource;
  averageMainClassLevel: number;
  /** null when no matched character had a support class */
  averageSupportClassLevel: number | null;
  /** percent of runs in which it had dropped by this room, limited to types the build uses */
  availableHoldablePercentages: HoldableAndPercent[];
}
