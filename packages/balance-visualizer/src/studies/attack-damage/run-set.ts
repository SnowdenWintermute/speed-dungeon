import { EquipmentSlotId } from "@speed-dungeon/common";
import { AnalysisSampleCollectingRunSet } from "@/analysis-runs/run-set";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { attackDamageAnalysisRun } from "./run";
import { AttackDamageCombatantReport, CombatantReportTooltipDamage } from "./run-reporter";
import { AttackDamageSample, SampleTooltipDamage } from "./samples";

function toSampleTooltipDamage(tooltipDamage: CombatantReportTooltipDamage): SampleTooltipDamage {
  const offHand = tooltipDamage[EquipmentSlotId.OffHand];
  return {
    [EquipmentSlotId.MainHand]: tooltipDamage[EquipmentSlotId.MainHand].toSerialized(),
    [EquipmentSlotId.OffHand]: offHand === null ? null : offHand.toSerialized(),
  };
}

export function attackDamageRunSet(characterSpecs: AnalysisCharacterSpecification[]) {
  return new AnalysisSampleCollectingRunSet<AttackDamageCombatantReport, AttackDamageSample>(
    () => attackDamageAnalysisRun(characterSpecs),
    (dimensions, combatantReport) => {
      const { heldEquipment } = combatantReport;
      return {
        ...dimensions,
        sampledDamageOnDummy: combatantReport.sampledDamageOnDummy,
        mainHandSwingCount: combatantReport.mainHandSwingCount,
        mainHandLandedHitCount: combatantReport.mainHandLandedHitCount,
        mainHandCriticalHitCount: combatantReport.mainHandCriticalHitCount,
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
