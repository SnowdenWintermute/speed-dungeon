import {
  COMBAT_ATTRIBUTES,
  CombatAttribute,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

export class AttributeRequirementThreshold {
  private minimums: Partial<Record<CombatAttribute, number>>;

  constructor(minimums: Partial<Record<CombatAttribute, number>> = {}) {
    this.minimums = { ...minimums };
  }

  getMinimums() {
    return this.minimums;
  }

  covers(other: AttributeRequirementThreshold) {
    for (const [attribute, required] of iterateNumericEnumKeyedRecord(other.minimums)) {
      if ((this.minimums[attribute] || 0) < required) {
        return false;
      }
    }

    return true;
  }

  joinedWith(other: AttributeRequirementThreshold) {
    const joined = new AttributeRequirementThreshold(this.minimums);
    for (const [attribute, required] of iterateNumericEnumKeyedRecord(other.minimums)) {
      if ((joined.minimums[attribute] || 0) < required) {
        joined.minimums[attribute] = required;
      }
    }

    return joined;
  }

  // an overestimate if a requirement is ever placed on a derived attribute, since closing one
  // deficit could close another. erring high only ever discards a threshold we could afford
  pointsToReach(attributesBeforeAllocation: Record<CombatAttribute, number>) {
    let points = 0;
    for (const [attribute, required] of iterateNumericEnumKeyedRecord(this.minimums)) {
      points += Math.max(0, required - attributesBeforeAllocation[attribute]);
    }

    return points;
  }

  getKey() {
    return COMBAT_ATTRIBUTES.map((attribute) => this.minimums[attribute] || 0).join(",");
  }
}
