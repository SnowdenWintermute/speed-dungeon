import {
  Combatant,
  CombatAttribute,
  Equipment,
  EquipmentSlotId,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { EquipmentByRequirementThresholds } from "./equipment-set-requirement-thresholds";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification";

export class ThresholdEquipmentSetScores {
  constructor(
    private combatant: Combatant,
    private chasedAttribute: CombatAttribute,
    private equipmentByRequirementThresholds: EquipmentByRequirementThresholds
  ) {}

  private getBestInSlot(
    slotId: EquipmentSlotId,
    combatantSpecialty: CharacterWeaponSpecialty,
    equipmentList: Set<Equipment>
  ) {
    let currentBest: { equipment: Equipment; score: number } | null = null;

    const { combatantProperties } = this.combatant;
    const { attributeProperties } = combatantProperties;
    const baselineScore = attributeProperties.getAttributeValue(this.chasedAttribute);

    for (const equipment of equipmentList) {
      const isCompatibleWithSpec = AnalysisCharacterSpecification.wouldConsiderEquipmentTypeInSlot(
        combatantSpecialty,
        equipment.equipmentBaseItemProperties.equipmentType,
        slotId
      );

      if (!isCompatibleWithSpec) {
        continue;
      }

      // try on equipment to measure score, thereby measuring derived attributes if any
      equipment.requirements = {};
      combatantProperties.equipment.putEquipmentInSlot(equipment, slotId);
      const score = baselineScore - attributeProperties.getAttributeValue(this.chasedAttribute);
      combatantProperties.equipment.unequipAll();

      if (score > 0 && (currentBest === null || score > currentBest.score)) {
        currentBest = { equipment, score };
      }
    }

    return currentBest?.equipment;
  }

  getBestInSlotByThreshold(combatantSpecialty: CharacterWeaponSpecialty) {
    const { equipmentByRequirementThreshold } = this.equipmentByRequirementThresholds;

    for (const [threshold, equipmentList] of equipmentByRequirementThreshold) {
      for (const slotId of iterateNumericEnum(EquipmentSlotId)) {
        const bestInSlotOption = this.getBestInSlot(slotId, combatantSpecialty, equipmentList);
        //
      }
    }
  }
  // For each ThresholdEquipmentList,
  // - get the best-in-slot equipment in each slot
  // - sum the scores for each slot
  // - for each required attribute in the threshold, if that attribute does not contribute to the
  //   chased attribute AND that attribute could have been allocated to another attribute that could
  //   have contributed to the chased attribute, subtract the amount it could have contributed from
  //   the threshold set's score
}
