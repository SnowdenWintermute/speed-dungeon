import { EquipmentProperties } from "./index.js";
import { CombatAttribute } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { AffixType, PrefixType } from "../affixes.js";
import { EquipmentTraitType } from "../equipment-traits/index.js";
import { EquipmentType } from "../equipment-types/index.js";

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
      if (
        equipmentProperties.affixes[AffixType.Prefix][PrefixType.PercentDamage] !== undefined &&
        equipmentProperties.affixes[AffixType.Prefix][PrefixType.PercentDamage].equipmentTraits[
          EquipmentTraitType.DamagePercentage
        ] !== undefined
      ) {
        percentDamageModifier =
          1.0 +
          equipmentProperties.affixes[AffixType.Prefix][PrefixType.PercentDamage].equipmentTraits[
            EquipmentTraitType.DamagePercentage
          ].percentage /
            100.0;
      }
      return new NumberRange(
        (equipmentProperties.equipmentBaseItemProperties.damage.min + damageAttribute) *
          percentDamageModifier,
        (equipmentProperties.equipmentBaseItemProperties.damage.max + damageAttribute) *
          percentDamageModifier
      );
  }
}
