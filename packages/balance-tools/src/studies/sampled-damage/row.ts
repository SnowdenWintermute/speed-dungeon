import { NumberRange } from "@speed-dungeon/common";
import { AnalysisTableRow } from "../../analysis-runs/analysis-sample-table.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { HoldableAndPercent } from "../../analysis-subjects/equipment-base-item-tally.ts";
import { SampledDamageContributingAttribute } from "./run-reporter.ts";

export type AverageContributingAttributes = Record<
  SampledDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number; total: number }
>;

export interface SampledDamageTableRow extends AnalysisTableRow {
  damageOnDummy: Distribution;
  /** normalized share of the room's primary action uses that landed, additional ones excluded */
  primaryHitRate: number;
  /** normalized share of the room's landed primary hits that crit, additional ones excluded */
  primaryCriticalHitRate: number;
  averageTooltipDamage: {
    primary: NumberRange;
    /** null when no matched character had an additional action to quote, such as an off hand swing */
    additional: NumberRange | null;
  };
  averageContributingAttributes: AverageContributingAttributes;
  /** percent of matched characters that were holding it in this room */
  wornHoldablePercentages: HoldableAndPercent[];
}
