import { CombatantProperties } from "../../../combatants";
import Inventory from "../../../combatants/inventory";
import { SpeedDungeonGame } from "../../../game";
import { CombatActionType } from "../../combat-actions";
import { ActionResult } from "../action-result";

export default function applyActionResult(
  game: SpeedDungeonGame,
  actionResult: ActionResult,
  battleIdOption: null | string
) {
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
      Inventory.removeItem(userCombatantProperties.inventory, itemId);
    }
  }

  if (actionResult.hitPointChangesByEntityId !== null) {
    for (const [entityId, hitPointChange] of Object.entries(
      actionResult.hitPointChangesByEntityId
    )) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
      if (combatantResult instanceof Error) return combatantResult;
      const { combatantProperties } = combatantResult;
      CombatantProperties.changeHitPoints(combatantProperties, hitPointChange);
      // if dead, remove their tracker
    }
  }
}
