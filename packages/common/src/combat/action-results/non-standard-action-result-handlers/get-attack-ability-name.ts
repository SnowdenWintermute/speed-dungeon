import { CombatantAbilityName } from "../../../combatants";
import { ERROR_MESSAGES } from "../../../errors";
import { EquipmentType } from "../../../items";

export default function getAttackAbilityName(
  equipmentType: null | EquipmentType,
  isOffHand: boolean
): Error | CombatantAbilityName {
  if (isOffHand) {
    if (equipmentType !== null && equipmentType !== EquipmentType.OneHandedMeleeWeapon)
      return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    else return CombatantAbilityName.AttackMeleeOffhand;
  }
  if (equipmentType === null) return CombatantAbilityName.AttackMeleeMainhand;

  switch (equipmentType) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
      return CombatantAbilityName.AttackMeleeMainhand;
    case EquipmentType.TwoHandedRangedWeapon:
      return CombatantAbilityName.AttackRangedMainhand;
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Ring:
    case EquipmentType.Amulet:
    case EquipmentType.Shield:
      return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
  }
}
