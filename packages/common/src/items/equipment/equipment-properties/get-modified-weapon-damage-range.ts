import EquipmentProperties from ".";
import { CombatAttribute } from "../../../combatants";
import { ERROR_MESSAGES } from "../../../errors";
import NumberRange from "../../../primatives/number-range";
import { EquipmentTraitType } from "../equipment-traits";
import { EquipmentType } from "../equipment-types";

export default function getModifiedWeaponDamageRange(
  this: EquipmentProperties
): Error | NumberRange {
  switch (this.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      const damageAttribute = this.attributes[CombatAttribute.Damage] || 0;
      let percentDamageModifier = 1.0;
      for (const trait of this.traits) {
        if (trait.type === EquipmentTraitType.DamagePercentage) {
          percentDamageModifier = 1.0 + trait.value / 100.0;
        }
      }
      return new NumberRange(
        (this.equipmentTypeProperties.damage.min + damageAttribute) * percentDamageModifier,
        (this.equipmentTypeProperties.damage.max + damageAttribute) * percentDamageModifier
      );
  }
}
