import {
  Equipment,
  EquipmentBaseItem,
  EquipmentSlotId,
  EquipmentType,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification";
import { AttributeRequirementThreshold } from "./attribute-requirement-threshold";
import { ChasedAttributeMeter } from "./chased-attribute-meter";

interface RequirementThresholdSetEquipmentSlotCandidate {
  equipment: Equipment;
  requirements: AttributeRequirementThreshold;
  contribution: number;
}

export class RequirementThresholdSetEquipmentSlotCandidateRankings {
  private candidatesBySlot = new Map<
    EquipmentSlotId,
    RequirementThresholdSetEquipmentSlotCandidate[]
  >();

  constructor(
    private meter: ChasedAttributeMeter,
    specialty: CharacterWeaponSpecialty,
    equipmentByType: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>
  ) {
    const allEquipment = [...equipmentByType.values()].flatMap((byBaseItem) => [
      ...byBaseItem.values(),
    ]);
    const baselineScore = this.meter.getValue();

    for (const slotId of iterateNumericEnum(EquipmentSlotId)) {
      const candidates: RequirementThresholdSetEquipmentSlotCandidate[] = [];

      for (const equipment of allEquipment) {
        const wouldConsider = AnalysisCharacterSpecification.wouldConsiderEquipmentTypeInSlot(
          specialty,
          equipment.equipmentBaseItemProperties.equipmentType,
          slotId
        );
        if (!wouldConsider) {
          continue;
        }

        const contribution = this.measureContribution(equipment, slotId, baselineScore);
        if (contribution <= 0) {
          continue;
        }

        candidates.push({
          equipment,
          requirements: new AttributeRequirementThreshold(equipment.requirements),
          contribution,
        });
      }

      if (candidates.length === 0) {
        continue;
      }

      candidates.sort((a, b) => b.contribution - a.contribution);
      this.candidatesBySlot.set(slotId, candidates);
    }
  }

  // what the item is worth on its own, so the same measurement is never repeated per threshold
  private measureContribution(
    equipment: Equipment,
    slotId: EquipmentSlotId,
    baselineScore: number
  ) {
    const set: Partial<Record<EquipmentSlotId, Equipment>> = { [slotId]: equipment };
    const scoreWithEquipment = ChasedAttributeMeter.ignoringRequirements(equipment, () =>
      this.meter.wearing(set, () => this.meter.getValue())
    );

    return scoreWithEquipment - baselineScore;
  }

  getRankedSlotIds() {
    return [...this.candidatesBySlot.keys()];
  }

  getDistinctRequirements(slotId: EquipmentSlotId) {
    const byKey = new Map<string, AttributeRequirementThreshold>();
    // leaving the slot empty is always an option, and costs nothing
    byKey.set("", new AttributeRequirementThreshold());

    for (const { requirements } of this.candidatesBySlot.get(slotId) || []) {
      byKey.set(requirements.getKey(), requirements);
    }

    return [...byKey.values()];
  }

  getBestCoveredBy(slotId: EquipmentSlotId, threshold: AttributeRequirementThreshold) {
    for (const candidate of this.candidatesBySlot.get(slotId) || []) {
      if (threshold.covers(candidate.requirements)) {
        return candidate.equipment;
      }
    }

    return undefined;
  }
}
