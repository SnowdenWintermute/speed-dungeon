import { AbilityName, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import {
  EquipmentProperties,
  EquipmentSlot,
  EquipmentType,
  WeaponSlot,
} from "../../../items/index.js";
import { CombatAction, CombatActionType } from "../../combat-actions/index.js";
import { ActionResult } from "../action-result.js";
import { ActionResultCalculationArguments } from "../action-result-calculator.js";
import allTargetsWereKilled from "./all-targets-were-killed.js";
import calculateActionResult from "../index.js";
import { iterateNumericEnum } from "../../../utils/index.js";

export default function calculateAttackActionResult(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { userId } = args;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties: userCombatantProperties } = combatantResult;

  const actionResults: ActionResult[] = [];

  let mhAttackEndsTurn = false;

  const actionsToCalculate: CombatAction[] = [];

  for (const weaponSlot of iterateNumericEnum(WeaponSlot)) {
    if (mhAttackEndsTurn) continue;
    const equipmentSlot =
      weaponSlot === WeaponSlot.MainHand ? EquipmentSlot.MainHand : EquipmentSlot.OffHand;
    const equipmentOption = CombatantProperties.getEquipmentInSlot(
      userCombatantProperties,
      equipmentSlot
    );
    mhAttackEndsTurn = !!(
      equipmentOption &&
      EquipmentProperties.isTwoHanded(equipmentOption.equipmentBaseItemProperties.type)
    );

    const combatActionOption = getAttackCombatActionOption(userCombatantProperties, weaponSlot);
    if (combatActionOption) actionsToCalculate.push(combatActionOption);
  }

  for (const action of actionsToCalculate) {
    const actionResultArgs: ActionResultCalculationArguments = {
      ...args,
      combatAction: action,
    };
    const actionResult = calculateActionResult(game, actionResultArgs);
    if (actionResult instanceof Error) return actionResult;
    actionResults.push(actionResult);
    const allTargetsDefeatedResult = allTargetsWereKilled(game, actionResult);
    if (allTargetsDefeatedResult instanceof Error) return allTargetsDefeatedResult;

    if (allTargetsDefeatedResult) {
      mhAttackEndsTurn = true;
      actionResult.endsTurn = true;
      break;
    }
  }

  return actionResults;
}

export function getAttackCombatActionOption(
  combatantProperties: CombatantProperties,
  weaponSlot: WeaponSlot
): null | CombatAction {
  const equipmentSlot =
    weaponSlot === WeaponSlot.MainHand ? EquipmentSlot.MainHand : EquipmentSlot.OffHand;

  const equipmentOption = CombatantProperties.getEquipmentInSlot(
    combatantProperties,
    equipmentSlot
  );

  if (
    !equipmentOption || // unarmed
    equipmentOption.equipmentBaseItemProperties.type === EquipmentType.OneHandedMeleeWeapon ||
    equipmentOption.equipmentBaseItemProperties.type === EquipmentType.TwoHandedMeleeWeapon
  ) {
    const abilityName =
      weaponSlot === WeaponSlot.MainHand
        ? AbilityName.AttackMeleeMainhand
        : AbilityName.AttackMeleeOffhand;
    return { type: CombatActionType.AbilityUsed, abilityName };
  }

  if (equipmentOption.equipmentBaseItemProperties.type === EquipmentType.TwoHandedRangedWeapon)
    return { type: CombatActionType.AbilityUsed, abilityName: AbilityName.AttackRangedMainhand };

  return null;
}
