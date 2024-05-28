import EquipmentProperties from ".";
import { CombatAttribute } from "../../../combatants";
import { ERROR_MESSAGES } from "../../../errors";
import NumberRange from "../../../primatives/number-range";
import { EquipmentTraitType } from "../equipment-traits";
import { EquipmentType } from "../equipment-types";

export default function getModifiedWeaponDamageRange(
  equipmentProperties: EquipmentProperties
): Error | NumberRange {
  switch (equipmentProperties.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      const damageAttribute = equipmentProperties.attributes[CombatAttribute.Damage] || 0;
      let percentDamageModifier = 1.0;
      for (const trait of equipmentProperties.traits) {
        if (trait.type === EquipmentTraitType.DamagePercentage) {
          percentDamageModifier = 1.0 + trait.value / 100.0;
        }
      }
      return new NumberRange(
        (equipmentProperties.equipmentTypeProperties.damage.min + damageAttribute) *
          percentDamageModifier,
        (equipmentProperties.equipmentTypeProperties.damage.max + damageAttribute) *
          percentDamageModifier
      );
  }
}
