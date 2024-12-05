import { CombatAction, CombatActionType } from "../index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { AbilityName, CombatantProperties } from "../../combatants/index.js";
import { EquipmentProperties, EquipmentSlot, Item } from "../../items/index.js";

export function getCombatActionExecutionTime(
  combatantProperties: CombatantProperties,
  combatAction: CombatAction
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case AbilityName.Attack:
        case AbilityName.AttackMeleeMainhand:
        case AbilityName.AttackMeleeOffhand:
          const mhWeaponOption = combatantProperties.equipment[EquipmentSlot.MainHand];
          if (!mhWeaponOption) return 1000;
          const equipmentPropertiesResult = Item.getEquipmentProperties(mhWeaponOption);
          if (equipmentPropertiesResult instanceof Error) return equipmentPropertiesResult;
          const isTwoHanded = EquipmentProperties.isTwoHanded(
            equipmentPropertiesResult.equipmentBaseItemProperties.type
          );
          if (isTwoHanded) return 2000;
          else return 1000;
        case AbilityName.AttackRangedMainhand:
        case AbilityName.Fire:
        case AbilityName.Ice:
        case AbilityName.Healing:
          return 2000;
      }
    case CombatActionType.ConsumableUsed:
      return DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME;
  }
}
