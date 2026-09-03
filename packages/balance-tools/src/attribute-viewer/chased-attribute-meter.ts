import {
  Combatant,
  CombatAttribute,
  Equipment,
  EquipmentSlotId,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

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
