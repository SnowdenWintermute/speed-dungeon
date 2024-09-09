import { CombatAction, CombatActionType } from "..";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app_consts";
import { CombatantAbilityName, CombatantProperties } from "../../combatants";
import { EquipmentProperties, EquipmentSlot, Item } from "../../items";

export function getCombatActionExecutionTime(
  combatantProperties: CombatantProperties,
  combatAction: CombatAction
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case CombatantAbilityName.Attack:
        case CombatantAbilityName.AttackMeleeMainhand:
        case CombatantAbilityName.AttackMeleeOffhand:
          const mhWeaponOption = combatantProperties.equipment[EquipmentSlot.MainHand];
          if (!mhWeaponOption) return 1000;
          const equipmentPropertiesResult = Item.getEquipmentProperties(mhWeaponOption);
          if (equipmentPropertiesResult instanceof Error) return equipmentPropertiesResult;
          const isTwoHanded = EquipmentProperties.isTwoHanded(
            equipmentPropertiesResult.equipmentBaseItemProperties.type
          );
          if (isTwoHanded) return 2000;
          else return 1000;
        case CombatantAbilityName.AttackRangedMainhand:
        case CombatantAbilityName.Fire:
        case CombatantAbilityName.Ice:
        case CombatantAbilityName.Healing:
          return 2000;
      }
    case CombatActionType.ConsumableUsed:
      return DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME;
  }
}
