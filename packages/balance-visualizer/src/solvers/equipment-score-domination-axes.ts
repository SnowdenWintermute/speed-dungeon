import { AffixType, CombatAttribute, Equipment } from "@speed-dungeon/common";

export const EQUIPMENT_SCORE_DOMINATION_AXES = {
  strength: (equipment: Equipment) =>
    equipment.getAffixAttributeValue(AffixType.Strength, CombatAttribute.Strength),
  dexterity: (equipment: Equipment) =>
    equipment.getAffixAttributeValue(AffixType.Dexterity, CombatAttribute.Dexterity),
  accuracy: (equipment: Equipment) =>
    equipment.getAffixAttributeValue(AffixType.Accuracy, CombatAttribute.Accuracy),
  nonWeaponFlatDamage: (equipment: Equipment) => {
    if (equipment.isWeapon()) {
      // checked by the actual weapon's final damage
      return 0;
    } else {
      return equipment.getFlatDamageBonus();
    }
  },
  weaponDamageAverage: (equipment: Equipment) => {
    if (!equipment.isWeapon()) {
      return 0;
    } else {
      return Math.floor(
        Equipment.getModifiedWeaponDamageRange(
          equipment.affixes,
          equipment.requireWeaponProperties().damage
        ).getAverage()
      );
    }
  },
};
