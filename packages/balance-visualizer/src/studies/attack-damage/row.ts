import { NumberRange } from "@speed-dungeon/common";
import { AnalysisTableRow } from "@/analysis-runs/analysis-sample-table";
import { Distribution } from "@/statistics/distribution";
import { HoldableAndPercent } from "@/analysis-subjects/equipment-base-item-tally";
import { AttackDamageContributingAttribute } from "./run-reporter";

export type AverageContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number; total: number }
>;

export interface AttackDamageTableRow extends AnalysisTableRow {
  damageOnDummy: Distribution;
  averageTooltipDamage: {
    mainHand: NumberRange;
    /** null when no matched character had an off hand attack to quote */
    offHand: NumberRange | null;
  };
  averageContributingAttributes: AverageContributingAttributes;
  /** percent of matched characters that were holding it in this room */
  wornHoldablePercentages: HoldableAndPercent[];
}
