import { CombatAttribute } from "../../combatants/attributes/index.js";
import { BookConsumableType, ConsumableType } from "../consumables/index.js";
import { Equipment, EquipmentType, STAVES, WANDS } from "../equipment/index.js";
import { KineticDamageType } from "../../combat/kinetic-damage-types.js";

export const BOOK_TRADE_ACCEPTED_EQUIPMENT_CHECKERS: Record<
  BookConsumableType,
  (equipment: Equipment) => boolean
> = {
  [ConsumableType.WarriorSkillbook]: (equipment) => {
    const { equipmentType } = equipment.equipmentBaseItemProperties;
    if (equipmentType !== EquipmentType.OneHandedMeleeWeapon) return false;

    if (equipment.hasAffixWithAttributes([CombatAttribute.Strength])) return true;

    return false;
  },
  [ConsumableType.RogueSkillbook]: (equipment) => {
    const weaponPropertiesResult = equipment.getWeaponProperties();
    if (weaponPropertiesResult instanceof Error) return false;

    const { equipmentType } = equipment.equipmentBaseItemProperties;

    // allow slashing 1h weapons with dex or accuracy
    if (equipmentType === EquipmentType.OneHandedMeleeWeapon) {
      let isSlashing = false;

      for (const classification of weaponPropertiesResult.damageClassification) {
        if (classification.kineticDamageTypeOption === KineticDamageType.Slashing)
          isSlashing = true;
      }

      if (!isSlashing) return false;

      const requiredAttributes = [CombatAttribute.Dexterity, CombatAttribute.Accuracy];

      if (equipment.hasAffixWithAttributes(requiredAttributes)) return true;
    }

    // allow bows with dex, accuracy or evasion
    if (equipmentType === EquipmentType.TwoHandedRangedWeapon) {
      const requiredAttributes = [
        CombatAttribute.Dexterity,
        CombatAttribute.Accuracy,
        CombatAttribute.Evasion,
      ];
      if (equipment.hasAffixWithAttributes(requiredAttributes)) return true;
    }

    return false;
  },
  [ConsumableType.MageSkillbook]: (equipment) => {
    const { baseItemType, equipmentType } =
      equipment.equipmentBaseItemProperties.taggedBaseEquipment;

    if (equipmentType === EquipmentType.OneHandedMeleeWeapon) {
      const isWand = WANDS.includes(baseItemType);
      if (!isWand) return false;

      if (equipment.hasAffixWithAttributes([CombatAttribute.Spirit])) return true;
    }

    if (equipmentType === EquipmentType.TwoHandedMeleeWeapon) {
      const isStaff = STAVES.includes(baseItemType);
      if (!isStaff) return false;

      if (equipment.hasAffixWithAttributes([CombatAttribute.Spirit])) return true;
    }

    return false;
  },
};
