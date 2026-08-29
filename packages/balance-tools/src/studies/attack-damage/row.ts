import { NumberRange } from "@speed-dungeon/common";
import { AnalysisTableRow } from "../../analysis-runs/analysis-sample-table.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { HoldableAndPercent } from "../../analysis-subjects/equipment-base-item-tally.ts";
import { AttackDamageContributingAttribute } from "./run-reporter.ts";

export type AverageContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number; total: number }
>;

export interface AttackDamageTableRow extends AnalysisTableRow {
  damageOnDummy: Distribution;
  /** normalized share of the room's main hand swings that landed, off hand swings excluded */
  mainHandHitRate: number;
  /** normalized share of the room's landed main hand hits that crit, off hand swings excluded */
  mainHandCriticalHitRate: number;
  averageTooltipDamage: {
    mainHand: NumberRange;
    /** null when no matched character had an off hand attack to quote */
    offHand: NumberRange | null;
  };
  averageContributingAttributes: AverageContributingAttributes;
  /** percent of matched characters that were holding it in this room */
  wornHoldablePercentages: HoldableAndPercent[];
}
