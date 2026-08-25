import { CombatantClass, EquipmentBaseItem, NormalizedPercentage } from "@speed-dungeon/common";
import { AttackDamageContributingAttribute } from "@/analysis-runs/analysis-run-reporter";
import { DamageRange } from "@/analysis-runs/attack-damage/samples";
import { Distribution } from "@/statistics/distribution";
import { CharacterWeaponSpecialty } from "@/analysis-subjects/analysis-character-specification";

export interface HoldableAndPercent {
  baseItem: EquipmentBaseItem;
  /** the denominator differs by column, so read it off the row field this came from */
  percent: NormalizedPercentage;
}

export type AverageContributingAttributes = Record<
  AttackDamageContributingAttribute,
  { fromGear: number; allocated: number; inherent: number; total: number }
>;

export interface AttackDamageTableRow {
  floor: number;
  room: number;
  sampleCount: number;
  damageOnDummy: Distribution;
  averageMainClassLevel: number;
  /** null when no matched character had a support class */
  averageSupportClassLevel: number | null;
  averageTooltipDamage: {
    mainHand: DamageRange;
    /** null when no matched character had an off hand attack to quote */
    offHand: DamageRange | null;
  };
  averageContributingAttributes: AverageContributingAttributes;
  /** percent of matched characters that were holding it in this room */
  wornHoldablePercentages: HoldableAndPercent[];
  /** percent of runs in which it had dropped by this room, limited to types the build uses */
  availableHoldablePercentages: HoldableAndPercent[];
}

/** an omitted dimension means "any", so dropping one widens the slice without a re-run */
export interface AttackDamageSlice {
  weaponSpecialty?: CharacterWeaponSpecialty;
  mainClass?: CombatantClass;
  supportClass?: CombatantClass | null;
}

export function roomKey(location: { floor: number; room: number }) {
  return `${location.floor}-${location.room}`;
}
