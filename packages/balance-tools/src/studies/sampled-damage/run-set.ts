import { EquipmentSlotId } from "@speed-dungeon/common";
import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisSampleCollectingRunSet } from "../../analysis-runs/run-set.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { sampledDamageAnalysisRun } from "./run.ts";
import { SampledDamageCombatantReport, CombatantReportTooltipDamage } from "./run-reporter.ts";
import { SampledDamageSample, SampleTooltipDamage } from "./samples.ts";

function toSampleTooltipDamage(tooltipDamage: CombatantReportTooltipDamage): SampleTooltipDamage {
  return {
    primary: tooltipDamage.primary.toSerialized(),
    additional: tooltipDamage.additional.map((range) => range.toSerialized()),
  };
}

export function sampledDamageRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return new AnalysisSampleCollectingRunSet<SampledDamageCombatantReport, SampledDamageSample>(
    () => sampledDamageAnalysisRun(characterSpecs, allocationIntensity, options),
    (dimensions, combatantReport) => {
      const { heldEquipment } = combatantReport;
      return {
        ...dimensions,
        sampledDamageOnDummy: combatantReport.sampledDamageOnDummy,
        primaryUseCount: combatantReport.primaryUseCount,
        primaryLandedHitCount: combatantReport.primaryLandedHitCount,
        primaryCriticalHitCount: combatantReport.primaryCriticalHitCount,
        tooltipDamage: toSampleTooltipDamage(combatantReport.tooltipDamage),
        wornHoldables: {
          [EquipmentSlotId.MainHand]:
            heldEquipment[EquipmentSlotId.MainHand]?.equipmentBaseItemProperties ?? null,
          [EquipmentSlotId.OffHand]:
            heldEquipment[EquipmentSlotId.OffHand]?.equipmentBaseItemProperties ?? null,
        },
        contributingAttributes: combatantReport.contributingAttributes,
      };
    }
  );
}
