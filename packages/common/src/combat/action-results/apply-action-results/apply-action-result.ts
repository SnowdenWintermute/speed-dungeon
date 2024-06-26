import { CombatantProperties } from "../../../combatants";
import { Inventory } from "../../../combatants/inventory";
import { ERROR_MESSAGES } from "../../../errors";
import { SpeedDungeonGame } from "../../../game";
import { CombatActionType } from "../../combat-actions";
import { ActionResult } from "../action-result";

export default function applyActionResult(
  game: SpeedDungeonGame,
  actionResult: ActionResult,
  battleIdOption: null | string
): Error | void {
  const { userId } = actionResult;
  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;
  userCombatantProperties.selectedCombatAction = null;
  userCombatantProperties.combatActionTarget = null;

  if (actionResult.action.type === CombatActionType.ConsumableUsed) {
    const { itemId } = actionResult.action;
    const consumableResult = Inventory.getConsumableProperties(
      userCombatantProperties.inventory,
      itemId
    );
    if (consumableResult instanceof Error) return consumableResult;
    consumableResult.usesRemaining -= 1;
    if (consumableResult.usesRemaining < 1) {
      const itemResult = Inventory.removeItem(userCombatantProperties.inventory, itemId);
      if (itemResult instanceof Error) return itemResult;
    }
  }

  if (actionResult.hitPointChangesByEntityId !== null) {
    for (const [entityId, hitPointChange] of Object.entries(
      actionResult.hitPointChangesByEntityId
    )) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
      if (combatantResult instanceof Error) return combatantResult;
      const { combatantProperties, entityProperties } = combatantResult;
      CombatantProperties.changeHitPoints(combatantProperties, hitPointChange);
      // if dead, remove their tracker
      if (combatantProperties.hitPoints < 1 && battleIdOption !== null) {
        const battleOption = game.battles[battleIdOption];
        if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
        const battle = battleOption;
        let indexToRemoveOption = null;
        battle.turnTrackers.forEach((turnTracker, i) => {
          if (turnTracker.entityId === entityProperties.id) {
            indexToRemoveOption = i;
          }
        });
        if (indexToRemoveOption !== null) battle.turnTrackers.splice(indexToRemoveOption, 1);
      }
    }
  }

  // mana changes
  if (actionResult.manaChangesByEntityId !== null) {
    for (const [entityId, manaChange] of Object.entries(actionResult.manaChangesByEntityId)) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
      if (combatantResult instanceof Error) return combatantResult;
      const { combatantProperties } = combatantResult;
      CombatantProperties.changeHitPoints(combatantProperties, manaChange);
    }
  }

  // mana prices
  if (actionResult.manaCostsPaidByEntityId !== null) {
    for (const [entityId, manaChange] of Object.entries(actionResult.manaCostsPaidByEntityId)) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
      if (combatantResult instanceof Error) return combatantResult;
      const { combatantProperties } = combatantResult;
      CombatantProperties.changeHitPoints(combatantProperties, manaChange);
    }
  }
}
