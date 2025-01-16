import { AbilityName, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatAction, CombatActionType } from "../../combat-actions/index.js";
import { ActionResult } from "../action-result.js";
import { ActionResultCalculationArguments } from "../action-result-calculator.js";
import allTargetsWereKilled from "./all-targets-were-killed.js";
import calculateActionResult from "../index.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { HoldableSlotType } from "../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../items/equipment/index.js";
import { CombatantEquipment } from "../../../combatants/combatant-equipment/index.js";

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

  for (const holdableSlotType of iterateNumericEnum(HoldableSlotType)) {
    if (mhAttackEndsTurn) continue;

    const equipmentOption = CombatantEquipment.getEquippedHoldable(
      userCombatantProperties,
      holdableSlotType
    );
    mhAttackEndsTurn = !!(
      equipmentOption &&
      !Equipment.isBroken(equipmentOption) &&
      Equipment.isTwoHanded(
        equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType
      )
    );

    const combatActionOption = getAttackCombatActionOption(
      userCombatantProperties,
      holdableSlotType
    );
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
  holdableSlotType: HoldableSlotType
): null | CombatAction {
  const equipmentOption = CombatantEquipment.getEquippedHoldable(
    combatantProperties,
    holdableSlotType
  );

  if (
    !equipmentOption || // unarmed
    Equipment.isBroken(equipmentOption) || // basically unarmed then
    equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
      EquipmentType.OneHandedMeleeWeapon ||
    equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
      EquipmentType.TwoHandedMeleeWeapon
  ) {
    const abilityName =
      holdableSlotType === HoldableSlotType.MainHand
        ? AbilityName.AttackMeleeMainhand
        : AbilityName.AttackMeleeOffhand;

    return { type: CombatActionType.AbilityUsed, abilityName };
  }

  if (
    equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
    EquipmentType.TwoHandedRangedWeapon
  )
    return { type: CombatActionType.AbilityUsed, abilityName: AbilityName.AttackRangedMainhand };

  return null;
}
