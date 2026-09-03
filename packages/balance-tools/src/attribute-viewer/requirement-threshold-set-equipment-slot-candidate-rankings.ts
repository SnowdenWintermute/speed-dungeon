import {
  Combatant,
  CombatAttribute,
  Equipment,
  EquipmentBaseItem,
  EquipmentSlotId,
  EquipmentType,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification";
import { AttributeRequirementThreshold } from "./attribute-requirement-threshold";

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
    private combatant: Combatant,
    private chasedAttribute: CombatAttribute,
    specialty: CharacterWeaponSpecialty,
    equipmentByType: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>
  ) {
    const allEquipment = [...equipmentByType.values()].flatMap((byBaseItem) => [
      ...byBaseItem.values(),
    ]);
    const baselineScore = this.getChasedAttributeValue();

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

  private getChasedAttributeValue() {
    return this.combatant.combatantProperties.attributeProperties.getAttributeValue(
      this.chasedAttribute
    );
  }

  // what the item is worth on its own, so the same measurement is never repeated per threshold.
  // requirements come off for the measurement because meeting them is the threshold's job
  private measureContribution(
    equipment: Equipment,
    slotId: EquipmentSlotId,
    baselineScore: number
  ) {
    const { combatantProperties } = this.combatant;

    const savedRequirements = equipment.requirements;
    equipment.requirements = {};
    combatantProperties.equipment.putEquipmentInSlot(equipment, slotId);
    const scoreWithEquipment = this.getChasedAttributeValue();
    combatantProperties.equipment.unequipAll();
    combatantProperties.inventory.deleteAllItems();
    equipment.requirements = savedRequirements;

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
