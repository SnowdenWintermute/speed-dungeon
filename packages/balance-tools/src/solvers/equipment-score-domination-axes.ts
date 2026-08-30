import { AffixType, CombatAttribute, Equipment } from "@speed-dungeon/common";
import { EquipmentScoreDominationAxis } from "./equipment-score-domination-axis.ts";

export const EQUIPMENT_SCORE_DOMINATION_AXES: Record<
  EquipmentScoreDominationAxis,
  (equipment: Equipment) => number
> = {
  [EquipmentScoreDominationAxis.Strength]: (equipment) =>
    equipment.getAffixAttributeValue(AffixType.Strength, CombatAttribute.Strength),
  [EquipmentScoreDominationAxis.Dexterity]: (equipment) =>
    equipment.getAffixAttributeValue(AffixType.Dexterity, CombatAttribute.Dexterity),
  [EquipmentScoreDominationAxis.Spirit]: (equipment) =>
    equipment.getAffixAttributeValue(AffixType.Spirit, CombatAttribute.Spirit),
  [EquipmentScoreDominationAxis.Accuracy]: (equipment) =>
    equipment.getAffixAttributeValue(AffixType.Accuracy, CombatAttribute.Accuracy),
  [EquipmentScoreDominationAxis.NonWeaponFlatDamage]: (equipment) => {
    if (equipment.isWeapon()) {
      // checked by the actual weapon's final damage
      return 0;
    } else {
      return equipment.getFlatDamageBonus();
    }
  },
  [EquipmentScoreDominationAxis.WeaponDamageAverage]: (equipment) => {
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
