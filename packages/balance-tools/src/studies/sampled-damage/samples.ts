import {
  EquipmentBaseItem,
  HoldableSlotId,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { AnalysisSampleDimensions } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleRunSetResult } from "../../analysis-runs/run-set.ts";
import { CombatantContributingAttributes } from "./run-reporter.ts";

// serialized because sent through worker message
export interface SampleTooltipDamage {
  primary: SerializedOf<NumberRange>;
  additional: SerializedOf<NumberRange>[];
}

/** One denormalized row per run, room and character. */
export interface SampledDamageSample extends AnalysisSampleDimensions {
  sampledDamageOnDummy: number;
  primaryUseCount: number;
  primaryLandedHitCount: number;
  primaryCriticalHitCount: number;
  tooltipDamage: SampleTooltipDamage;
  wornHoldables: Record<HoldableSlotId, EquipmentBaseItem | null>;
  contributingAttributes: CombatantContributingAttributes;
}

export type SampledDamageRunSetResult = AnalysisSampleRunSetResult<SampledDamageSample>;
