import { CombatantProperties } from "../../../combatants";
import { SpeedDungeonGame } from "../../../game";
import { EquipmentProperties, EquipmentSlot, EquipmentType } from "../../../items";
import { ActionResult } from "../action-result";
import { ActionResultCalculationArguments } from "../action-result-calculator";

export default function attackResultCalculator(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { userId } = args;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties: userCombatantProperties } = combatantResult;
  const combatantLevel = userCombatantProperties.level;

  const actionResults: ActionResult[] = [];

  let mhEquipmentOption =
    CombatantProperties.getEquipmentInSlot(userCombatantProperties, EquipmentSlot.MainHand) || null;
  let ohEquipmentOption =
    CombatantProperties.getEquipmentInSlot(userCombatantProperties, EquipmentSlot.MainHand) || null;
  // shields can't be used to attack
  let mhWeaponOption = mhEquipmentOption;
  if (mhEquipmentOption && mhEquipmentOption.equipmentTypeProperties.type === EquipmentType.Shield)
    mhWeaponOption = null;
  let ohWeaponOption = mhEquipmentOption;
  if (ohEquipmentOption && ohEquipmentOption.equipmentTypeProperties.type === EquipmentType.Shield)
    ohWeaponOption = null;

  let mhAttackEndsTurn = false;
  if (ohEquipmentOption && ohEquipmentOption.equipmentTypeProperties.type === EquipmentType.Shield)
    mhAttackEndsTurn = true;
  if (
    mhEquipmentOption !== null &&
    EquipmentProperties.isTwoHanded(mhEquipmentOption.equipmentTypeProperties.type)
  )
    mhAttackEndsTurn = true;

  //
}
