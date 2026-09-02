import {
  CombatAttribute,
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import isEqual from "lodash.isequal";

export type AttributeRequirmentThreshold = Partial<Record<CombatAttribute, number>>;

export class EquipmentByRequirementThresholds {
  private _equipmentByRequirementThreshold = new Map<
    AttributeRequirmentThreshold,
    Set<Equipment>
  >();

  constructor(equipmentByType: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>) {
    this.makeSets(equipmentByType);
  }

  private thresholdsAreEqual(a: AttributeRequirmentThreshold, b: AttributeRequirmentThreshold) {
    return isEqual(a, b);
  }

  private thresholdCoversOther(
    threshold: AttributeRequirmentThreshold,
    other: AttributeRequirmentThreshold
  ) {
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(other)) {
      const thresholdAttribute = threshold[attribute] || 0;
      const isCovered = thresholdAttribute >= value;
      if (!isCovered) {
        return false;
      }
    }

    return true;
  }

  private getThresholdSetIfExists(requirements: AttributeRequirmentThreshold) {
    for (const [threshold, set] of this._equipmentByRequirementThreshold) {
      if (this.thresholdsAreEqual(requirements, threshold)) {
        return set;
      }
    }
  }

  // equipment grouped by their explicit requirements, before adding equipment with
  // lower requirements to the sets
  private makeExplicitSets(equipmentByType: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>) {
    for (const [_equipmentType, equipmentByBaseItem] of equipmentByType) {
      for (const [_baseItem, equipment] of equipmentByBaseItem) {
        const { requirements } = equipment;
        const existingThresholdSetOption = this.getThresholdSetIfExists(requirements);
        if (existingThresholdSetOption) {
          existingThresholdSetOption.add(equipment);
        } else {
          this._equipmentByRequirementThreshold.set(requirements, new Set([equipment]));
        }
      }
    }
  }

  private addLowerRequiredEquipmentToExplicitSets() {
    for (const [threshold, set] of this._equipmentByRequirementThreshold) {
      for (const [other, otherSet] of this._equipmentByRequirementThreshold) {
        if (this.thresholdCoversOther(threshold, other)) {
          for (const equipment of otherSet) {
            set.add(equipment);
          }
        }
      }
    }
  }

  private makeSets(equipmentByType: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>) {
    this.makeExplicitSets(equipmentByType);
    this.addLowerRequiredEquipmentToExplicitSets();
  }

  get equipmentByRequirementThreshold() {
    return this._equipmentByRequirementThreshold;
  }
}
