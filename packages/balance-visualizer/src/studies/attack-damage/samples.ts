import {
  EquipmentBaseItem,
  EquipmentSlotId,
  HoldableSlotId,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { AnalysisSampleDimensions } from "@/analysis-runs/analysis-sample";
import { AnalysisSampleRunSetResult } from "@/analysis-runs/run-set";
import { CombatantAttackContributingAttributes } from "./run-reporter";

// serialized rather than the NumberRange itself: postMessage copies own properties without the
// prototype, so a class arrives on the other side with its fields and none of its methods
export interface SampleTooltipDamage {
  [EquipmentSlotId.MainHand]: SerializedOf<NumberRange>;
  [EquipmentSlotId.OffHand]: SerializedOf<NumberRange> | null;
}

/** One denormalized row per run, room and character. */
export interface AttackDamageSample extends AnalysisSampleDimensions {
  sampledDamageOnDummy: number;
  tooltipDamage: SampleTooltipDamage;
  wornHoldables: Record<HoldableSlotId, EquipmentBaseItem | null>;
  contributingAttributes: CombatantAttackContributingAttributes;
}

export type AttackDamageRunSetResult = AnalysisSampleRunSetResult<AttackDamageSample>;
