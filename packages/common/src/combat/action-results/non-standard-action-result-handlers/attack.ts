import { CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { EquipmentProperties, EquipmentSlot, EquipmentType } from "../../../items/index.js";
import { CombatAction, CombatActionType } from "../../combat-actions/index.js";
import { ActionResult } from "../action-result.js";
import { ActionResultCalculationArguments } from "../action-result-calculator.js";
import allTargetsWereKilled from "./all-targets-were-killed.js";
import getAttackAbilityName from "./get-attack-ability-name.js";
import calculateActionResult from "../index.js";

export default function calculateAttackActionResult(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { userId } = args;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties: userCombatantProperties } = combatantResult;

  const actionResults: ActionResult[] = [];

  let mhEquipmentOption =
    CombatantProperties.getEquipmentInSlot(userCombatantProperties, EquipmentSlot.MainHand) || null;
  let ohEquipmentOption =
    CombatantProperties.getEquipmentInSlot(userCombatantProperties, EquipmentSlot.MainHand) || null;

  // shields can't be used to attack, if not holding a shield they can attack with offhand unarmed strike
  let mhAttackEndsTurn = false;

  if (
    (mhEquipmentOption !== null &&
      EquipmentProperties.isTwoHanded(mhEquipmentOption.equipmentBaseItemProperties.type)) ||
    (ohEquipmentOption !== null &&
      ohEquipmentOption.equipmentBaseItemProperties.type === EquipmentType.Shield)
  )
    mhAttackEndsTurn = true;

  const mhAttackAbilityNameResult = getAttackAbilityName(
    mhEquipmentOption?.equipmentBaseItemProperties.type ?? null,
    false
  );

  if (mhAttackAbilityNameResult instanceof Error) return mhAttackAbilityNameResult;
  const mhAttackAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: mhAttackAbilityNameResult,
  };

  const mhActionResultArgs: ActionResultCalculationArguments = {
    ...args,
    combatAction: mhAttackAction,
  };

  const mhAttackResultResult = calculateActionResult(game, mhActionResultArgs);
  if (mhAttackResultResult instanceof Error) return mhAttackResultResult;

  const mhAttackResult = mhAttackResultResult;

  // if targets died, don't calculate the offhand swing
  const allTargetsDefeatedResult = allTargetsWereKilled(game, mhAttackResult);
  if (allTargetsDefeatedResult instanceof Error) return allTargetsDefeatedResult;
  const allTargetsDefeated = allTargetsDefeatedResult;
  if (allTargetsDefeated) mhAttackEndsTurn = true;

  mhAttackResult.endsTurn = mhAttackEndsTurn;
  actionResults.push(mhAttackResult);

  if (mhAttackEndsTurn) return actionResults;

  // OFFHAND
  const ohAttackAbilityNameResult = getAttackAbilityName(
    ohEquipmentOption?.equipmentBaseItemProperties.type ?? null,
    true
  );
  if (ohAttackAbilityNameResult instanceof Error) return ohAttackAbilityNameResult;
  const ohAttackAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: ohAttackAbilityNameResult,
  };

  const ohActionResultArgs: ActionResultCalculationArguments = {
    ...args,
    combatAction: ohAttackAction,
  };

  const ohAttackResultResult = calculateActionResult(game, ohActionResultArgs);
  if (ohAttackResultResult instanceof Error) return ohAttackResultResult;
  actionResults.push(ohAttackResultResult);

  return actionResults;
}
