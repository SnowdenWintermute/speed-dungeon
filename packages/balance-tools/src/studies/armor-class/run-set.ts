import { AllocationIntensity } from "../../analysis-runs/allocation-intensity.ts";
import { AnalysisRunOptions } from "../../analysis-runs/analysis-run-options.ts";
import { AnalysisSampleCollectingRunSet } from "../../analysis-runs/run-set.ts";
import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { armorClassAnalysisRun } from "./run.ts";
import { ArmorClassCombatantReport, armorClassSlotRecord } from "./run-reporter.ts";
import { ArmorClassSample } from "./samples.ts";

export function armorClassRunSet(
  characterSpecs: AnalysisCharacterSpecification[],
  allocationIntensity: AllocationIntensity,
  options: AnalysisRunOptions
) {
  return new AnalysisSampleCollectingRunSet<ArmorClassCombatantReport, ArmorClassSample>(
    () => armorClassAnalysisRun(characterSpecs, allocationIntensity, options),
    (dimensions, combatantReport) => {
      const { wornArmor } = combatantReport;
      return {
        ...dimensions,
        totalArmorClass: combatantReport.totalArmorClass,
        armorClassBySlot: combatantReport.armorClassBySlot,
        // only the base item crosses the worker boundary; the equipment itself is not serializable
        wornArmor: armorClassSlotRecord(
          (slotId) => wornArmor[slotId]?.equipmentBaseItemProperties ?? null
        ),
      };
    }
  );
}
