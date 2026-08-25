import { NumberRange } from "@speed-dungeon/common";
import { Distribution } from "@/statistics/distribution";
import { HoldableAndPercent } from "@/analysis-subjects/equipment-base-item-tally";
import { AttackDamageContributingAttribute } from "./run-reporter";

export type AverageContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number; total: number }
>;

export interface AttackDamageTableRow {
  floor: number;
  room: number;
  damageOnDummy: Distribution;
  averageMainClassLevel: number;
  /** null when no matched character had a support class */
  averageSupportClassLevel: number | null;
  averageTooltipDamage: {
    mainHand: NumberRange;
    /** null when no matched character had an off hand attack to quote */
    offHand: NumberRange | null;
  };
  averageContributingAttributes: AverageContributingAttributes;
  /** percent of matched characters that were holding it in this room */
  wornHoldablePercentages: HoldableAndPercent[];
  /** percent of runs in which it had dropped by this room, limited to types the build uses */
  availableHoldablePercentages: HoldableAndPercent[];
}
