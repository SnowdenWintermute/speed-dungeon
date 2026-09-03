import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  AttributePointAssignableAttributes,
  Combatant,
  CombatAttribute,
  Equipment,
  EquipmentSlotId,
  INVERTED_DERIVED_ATTRIBUTE_RATIOS,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import {
  AttributeRequirmentThreshold,
  EquipmentByRequirementThresholds,
} from "./equipment-set-requirement-thresholds";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification";

export class ThresholdEquipmentSetScores {
  constructor(
    private combatant: Combatant,
    private combatantSpecialty: CharacterWeaponSpecialty,
    private chasedAttribute: CombatAttribute,
    private equipmentByRequirementThresholds: EquipmentByRequirementThresholds
  ) {}

  private getBestInSlot(slotId: EquipmentSlotId, equipmentList: Set<Equipment>) {
    let currentBest: { equipment: Equipment; score: number } | null = null;

    const { combatantProperties } = this.combatant;
    const { attributeProperties } = combatantProperties;
    const baselineScore = attributeProperties.getAttributeValue(this.chasedAttribute);

    for (const equipment of equipmentList) {
      const isCompatibleWithSpec = AnalysisCharacterSpecification.wouldConsiderEquipmentTypeInSlot(
        this.combatantSpecialty,
        equipment.equipmentBaseItemProperties.equipmentType,
        slotId
      );

      if (!isCompatibleWithSpec) {
        continue;
      }

      // try on equipment to measure score, thereby measuring derived attributes if any
      equipment.requirements = {};
      combatantProperties.equipment.putEquipmentInSlot(equipment, slotId);
      const score = attributeProperties.getAttributeValue(this.chasedAttribute) - baselineScore;
      combatantProperties.equipment.unequipAll();

      if (score > 0 && (currentBest === null || score > currentBest.score)) {
        currentBest = { equipment, score };
      }
    }

    return currentBest;
  }

  private getBestInSlotByThreshold() {
    const { equipmentByRequirementThreshold } = this.equipmentByRequirementThresholds;
    const bestInSlotByThreshold = new Map<
      AttributeRequirmentThreshold,
      Partial<Record<EquipmentSlotId, Equipment>>
    >();

    for (const [threshold, equipmentList] of equipmentByRequirementThreshold) {
      for (const slotId of iterateNumericEnum(EquipmentSlotId)) {
        const bestInSlotOption = this.getBestInSlot(slotId, equipmentList);
        if (bestInSlotOption === null) {
          continue;
        }

        const thresholdBisSet = bestInSlotByThreshold.get(threshold) || {};
        thresholdBisSet[slotId] = bestInSlotOption.equipment;
        bestInSlotByThreshold.set(threshold, thresholdBisSet);
      }
    }

    return bestInSlotByThreshold;
  }

  private tryAllocateUntilThresholdMet(threshold: AttributeRequirmentThreshold) {
    const { attributeProperties } = this.combatant.combatantProperties;
    const totalAttributes = attributeProperties.getTotalAttributes();
    for (const [attribute, required] of iterateNumericEnumKeyedRecord(threshold)) {
      const current = totalAttributes[attribute];
      if (current >= required) {
        continue;
      }

      const needed = required - current;
      if (needed > attributeProperties.getUnspentPoints()) {
        return { possibleToMeetThresholdRequirements: false };
      }

      attributeProperties.changeUnspentPoints(-needed);
      attributeProperties.setSpeccedAttributeValue(attribute, needed);
    }

    return { possibleToMeetThresholdRequirements: true };
  }

  private getThresholdSetScore(equipmentSet: Partial<Record<EquipmentSlotId, Equipment>>) {
    const { equipment, attributeProperties } = this.combatant.combatantProperties;
    for (const [slotId, equipmentToTry] of iterateNumericEnumKeyedRecord(equipmentSet)) {
      equipment.putEquipmentInSlot(equipmentToTry, slotId);
    }

    const score = attributeProperties.getAttributeValue(this.chasedAttribute);

    equipment.unequipAll();

    return score;
  }

  private allocateRemainingTo(attribute: CombatAttribute) {
    const { attributeProperties } = this.combatant.combatantProperties;
    const unspent = attributeProperties.getUnspentPoints();
    for (let remaining = unspent; remaining > 0; remaining -= 1) {
      attributeProperties.allocatePoint(attribute);
    }
  }

  private getBestAttributeToResultInHighestDerived(
    ratios: Partial<Record<CombatAttribute, number>>
  ) {
    let currentBest: null | { attribute: CombatAttribute; ratio: number } = null;

    for (const [attribute, ratio] of iterateNumericEnumKeyedRecord(ratios)) {
      if (currentBest === null || ratio < currentBest.ratio) {
        currentBest = { attribute, ratio };
      }
    }

    return currentBest?.attribute;
  }

  private allocateAllPointsTowardChasedAttribute() {
    const chasedAttributeIsDirectlyAllocatable = ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(
      this.chasedAttribute as AttributePointAssignableAttributes
    );

    const chasedAttributeIsDerivedFromOption =
      INVERTED_DERIVED_ATTRIBUTE_RATIOS[this.chasedAttribute];

    if (chasedAttributeIsDirectlyAllocatable) {
      this.allocateRemainingTo(this.chasedAttribute);
    } else if (chasedAttributeIsDerivedFromOption !== undefined) {
      const attributeOption = this.getBestAttributeToResultInHighestDerived(
        chasedAttributeIsDerivedFromOption
      );

      if (attributeOption !== undefined) {
        this.allocateRemainingTo(attributeOption);
      }
    }
  }

  getScoredSets() {
    const { attributeProperties } = this.combatant.combatantProperties;
    const unspentAttributePointsBeforeAllocation = attributeProperties.getUnspentPoints();

    const scoredSets = new Map<
      Partial<Record<CombatAttribute, number>>,
      { set: Partial<Record<EquipmentSlotId, Equipment>>; score: number }
    >();

    const bestInSlotByThreshold = this.getBestInSlotByThreshold();
    for (const [threshold, equipmentSet] of bestInSlotByThreshold) {
      const { possibleToMeetThresholdRequirements } = this.tryAllocateUntilThresholdMet(threshold);
      if (!possibleToMeetThresholdRequirements) {
        scoredSets.set(threshold, { set: equipmentSet, score: 0 });
      } else {
        // points not used for requirements may be used to chase
        this.allocateAllPointsTowardChasedAttribute();

        scoredSets.set(threshold, {
          set: equipmentSet,
          score: this.getThresholdSetScore(equipmentSet),
        });
      }

      attributeProperties.unspentPointsAttributePoints = unspentAttributePointsBeforeAllocation;
      for (const [attribute, _] of iterateNumericEnumKeyedRecord(threshold)) {
        attributeProperties.setSpeccedAttributeValue(attribute, 0);
      }
    }

    return scoredSets;
  }
}
