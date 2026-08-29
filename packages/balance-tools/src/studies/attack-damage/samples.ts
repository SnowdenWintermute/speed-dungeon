import {
  EquipmentBaseItem,
  EquipmentSlotId,
  HoldableSlotId,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { AnalysisSampleDimensions } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleRunSetResult } from "../../analysis-runs/run-set.ts";
import { CombatantAttackContributingAttributes } from "./run-reporter.ts";

// serialized because sent through worker message
export interface SampleTooltipDamage {
  [EquipmentSlotId.MainHand]: SerializedOf<NumberRange>;
  [EquipmentSlotId.OffHand]: SerializedOf<NumberRange> | null;
}

/** One denormalized row per run, room and character. */
export interface AttackDamageSample extends AnalysisSampleDimensions {
  sampledDamageOnDummy: number;
  mainHandSwingCount: number;
  mainHandLandedHitCount: number;
  mainHandCriticalHitCount: number;
  tooltipDamage: SampleTooltipDamage;
  wornHoldables: Record<HoldableSlotId, EquipmentBaseItem | null>;
  contributingAttributes: CombatantAttackContributingAttributes;
}

export type AttackDamageRunSetResult = AnalysisSampleRunSetResult<AttackDamageSample>;
