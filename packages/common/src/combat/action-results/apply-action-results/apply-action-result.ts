import { CombatantProperties } from "../../../combatants/index.js";
import { Inventory } from "../../../combatants/inventory.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionType } from "../../combat-actions/index.js";
import { ActionResult } from "../action-result.js";

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
  if (actionResult.manaCost !== null) {
    const combatantResult = SpeedDungeonGame.getCombatantById(game, actionResult.userId);
    if (combatantResult instanceof Error) return combatantResult;
    const { combatantProperties } = combatantResult;
    CombatantProperties.changeMana(combatantProperties, -actionResult.manaCost);
  }
}
