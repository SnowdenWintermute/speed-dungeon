import {
  COMBAT_ATTRIBUTES,
  Combatant,
  CombatAttribute,
  Equipment,
  EquipmentSlotId,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import type { AttributePointAssignableAttributes } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import {
  AttributeRequirementThreshold,
  EquipmentByRequirementThresholds,
} from "./equipment-set-requirement-thresholds";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification";
import { BestImprovementAttributeAllocation } from "../solvers/best-improvement-attribute-allocation";

interface CapturedAllocations {
  allocated: Record<CombatAttribute, number>;
  unspentPoints: number;
}

export interface ScoredEquipmentSet {
  threshold: AttributeRequirementThreshold;
  set: Partial<Record<EquipmentSlotId, Equipment>>;
  score: number;
}

export class ThresholdEquipmentSetScores {
  constructor(
    private combatant: Combatant,
    private combatantSpecialty: CharacterWeaponSpecialty,
    private chasedAttribute: CombatAttribute,
    private allocatableAttributes: AttributePointAssignableAttributes[],
    private equipmentByRequirementThresholds: EquipmentByRequirementThresholds
  ) {}

  private getChasedAttributeValue() {
    return this.combatant.combatantProperties.attributeProperties.getAttributeValue(
      this.chasedAttribute
    );
  }

  private getBestInSlot(slotId: EquipmentSlotId, equipmentList: Set<Equipment>) {
    let currentBest: { equipment: Equipment; score: number } | null = null;

    const { combatantProperties } = this.combatant;
    const baselineScore = this.getChasedAttributeValue();

    for (const equipment of equipmentList) {
      const isCompatibleWithSpec = AnalysisCharacterSpecification.wouldConsiderEquipmentTypeInSlot(
        this.combatantSpecialty,
        equipment.equipmentBaseItemProperties.equipmentType,
        slotId
      );

      if (!isCompatibleWithSpec) {
        continue;
      }

      const savedRequirements = equipment.requirements;
      equipment.requirements = {};
      combatantProperties.equipment.putEquipmentInSlot(equipment, slotId);
      const score = this.getChasedAttributeValue() - baselineScore;
      combatantProperties.equipment.unequipAll();
      combatantProperties.inventory.deleteAllItems();
      equipment.requirements = savedRequirements;

      if (score > 0 && (currentBest === null || score > currentBest.score)) {
        currentBest = { equipment, score };
      }
    }

    return currentBest;
  }

  private getBestInSlotByThreshold() {
    const { equipmentByRequirementThreshold } = this.equipmentByRequirementThresholds;
    const bestInSlotByThreshold = new Map<
      AttributeRequirementThreshold,
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

  private tryAllocateUntilThresholdMet(threshold: AttributeRequirementThreshold) {
    const { attributeProperties } = this.combatant.combatantProperties;

    for (const [attribute, required] of iterateNumericEnumKeyedRecord(threshold)) {
      // re-read rather than snapshot: closing one requirement can raise a derived attribute that
      // another requirement asks for
      const current = attributeProperties.getTotalAttributes()[attribute];
      if (current >= required) {
        continue;
      }

      const needed = required - current;
      if (needed > attributeProperties.getUnspentPoints()) {
        return { possibleToMeetThresholdRequirements: false };
      }

      const allocated = attributeProperties.getAllocatedAttributes()[attribute];
      attributeProperties.changeUnspentPoints(-needed);
      attributeProperties.setSpeccedAttributeValue(attribute, allocated + needed);
    }

    return { possibleToMeetThresholdRequirements: true };
  }

  private allocateRemainingTowardChasedAttribute() {
    const { attributeProperties } = this.combatant.combatantProperties;

    BestImprovementAttributeAllocation.allocate(
      this.combatant,
      this.allocatableAttributes,
      attributeProperties.getUnspentPoints(),
      () => this.getChasedAttributeValue()
    );
  }

  private getThresholdSetScore(equipmentSet: Partial<Record<EquipmentSlotId, Equipment>>) {
    const { equipment, inventory } = this.combatant.combatantProperties;
    for (const [slotId, equipmentToTry] of iterateNumericEnumKeyedRecord(equipmentSet)) {
      equipment.putEquipmentInSlot(equipmentToTry, slotId);
    }

    const score = this.getChasedAttributeValue();

    equipment.unequipAll();
    inventory.deleteAllItems();

    return score;
  }

  private captureAllocations(): CapturedAllocations {
    const { attributeProperties } = this.combatant.combatantProperties;
    return {
      allocated: attributeProperties.getAllocatedAttributes(),
      unspentPoints: attributeProperties.getUnspentPoints(),
    };
  }

  private restoreAllocations(captured: CapturedAllocations) {
    const { attributeProperties } = this.combatant.combatantProperties;
    for (const attribute of COMBAT_ATTRIBUTES) {
      attributeProperties.setSpeccedAttributeValue(attribute, captured.allocated[attribute]);
    }
    attributeProperties.unspentPointsAttributePoints = captured.unspentPoints;
  }

  getScoredSets(): ScoredEquipmentSet[] {
    const scoredSets: ScoredEquipmentSet[] = [];
    const allocationsBeforeScoring = this.captureAllocations();

    for (const [threshold, set] of this.getBestInSlotByThreshold()) {
      const { possibleToMeetThresholdRequirements } = this.tryAllocateUntilThresholdMet(threshold);

      if (!possibleToMeetThresholdRequirements) {
        scoredSets.push({ threshold, set, score: 0 });
      } else {
        this.allocateRemainingTowardChasedAttribute();
        scoredSets.push({ threshold, set, score: this.getThresholdSetScore(set) });
      }

      this.restoreAllocations(allocationsBeforeScoring);
    }

    return scoredSets;
  }
}
