import {
  Combatant,
  CombatAttribute,
  DERIVED_ATTRIBUTE_RATIO_LIST,
  Equipment,
  EquipmentSlotId,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

export interface AttributeSourceContributions {
  inherent: number;
  allocated: number;
  equipment: number;
}

export class ChasedAttributeMeter {
  constructor(
    private combatant: Combatant,
    private chasedAttribute: CombatAttribute
  ) {}

  getValue() {
    return this.combatant.combatantProperties.attributeProperties.getAttributeValue(
      this.chasedAttribute
    );
  }

  private getContribution(attributes: Record<CombatAttribute, number>) {
    let contribution = attributes[this.chasedAttribute];
    for (const { mainAttribute, derivedAttribute, ratio } of DERIVED_ATTRIBUTE_RATIO_LIST) {
      if (derivedAttribute === this.chasedAttribute) {
        contribution += attributes[mainAttribute] * ratio;
      }
    }
    return contribution;
  }

  // a derived attribute is credited to whichever source supplied its main attribute. the parts are
  // unfloored, so they can sum to slightly more than the floored total
  getSourceContributions(
    set: Partial<Record<EquipmentSlotId, Equipment>>
  ): AttributeSourceContributions {
    const { attributeProperties } = this.combatant.combatantProperties;
    const worn = iterateNumericEnumKeyedRecord(set).map(([, equipment]) => equipment);

    return {
      inherent: this.getContribution(attributeProperties.getInherentAttributes()),
      allocated: this.getContribution(attributeProperties.getAllocatedAttributes()),
      equipment: this.getContribution(Equipment.getAttributesOnEquipmentList(worn)),
    };
  }

  wearing<T>(set: Partial<Record<EquipmentSlotId, Equipment>>, whileWorn: () => T) {
    const { equipment, inventory } = this.combatant.combatantProperties;

    try {
      for (const [slotId, equipmentToWear] of iterateNumericEnumKeyedRecord(set)) {
        equipment.putEquipmentInSlot(equipmentToWear, slotId);
      }

      return whileWorn();
    } finally {
      equipment.unequipAll();
      inventory.deleteAllItems();
    }
  }

  // measuring asks what an item is worth, never whether it can be worn. meeting requirements is
  // the caller's own job and would otherwise zero out the very attributes being measured
  static ignoringRequirements<T>(equipment: Equipment, measure: () => T) {
    const savedRequirements = equipment.requirements;
    equipment.requirements = {};

    try {
      return measure();
    } finally {
      equipment.requirements = savedRequirements;
    }
  }
}
