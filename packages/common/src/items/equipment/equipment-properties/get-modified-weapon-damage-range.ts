import { EquipmentProperties } from ".";
import { CombatAttribute } from "../../../combatants";
import { ERROR_MESSAGES } from "../../../errors";
import { NumberRange } from "../../../primatives/number-range";
import { PrefixType } from "../affixes";
import { EquipmentType } from "../equipment-types";

export default function getModifiedWeaponDamageRange(
  equipmentProperties: EquipmentProperties
): Error | NumberRange {
  switch (equipmentProperties.equipmentBaseItemProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
    case EquipmentType.Amulet:
    case EquipmentType.Ring:
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      const damageAttribute = equipmentProperties.attributes[CombatAttribute.Damage] || 0;
      let percentDamageModifier = 1.0;
      for (const prefix of equipmentProperties.prefixes) {
        if (prefix.prefixType === PrefixType.PercentDamage) {
          percentDamageModifier = 1.0 + prefix.value / 100.0;
        }
      }
      return new NumberRange(
        (equipmentProperties.equipmentBaseItemProperties.damage.min + damageAttribute) *
          percentDamageModifier,
        (equipmentProperties.equipmentBaseItemProperties.damage.max + damageAttribute) *
          percentDamageModifier
      );
  }
}
