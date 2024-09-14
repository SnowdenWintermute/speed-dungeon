import {
  CombatantProperties,
  Inventory,
  PayAbilityCostsActionCommandPayload,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import { ActionCommandManager } from "@speed-dungeon/common/src/action-processing/action-command-manager";

// SERVER
// - apply ability costs to game
// - process the next command
export function payAbilityCostsActionCommandHandler(
  this: GameServer,
  actionCommandManager: ActionCommandManager,
  gameName: string,
  entityId: string,
  payload: PayAbilityCostsActionCommandPayload
) {
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, entityId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { combatant } = actionAssociatedDataResult;

  for (const itemId of payload.itemIds) {
    Inventory.removeItem(combatant.combatantProperties.inventory, itemId);
  }
  if (payload.hp) CombatantProperties.changeHitPoints(combatant.combatantProperties, -payload.hp);
  if (payload.mp) CombatantProperties.changeMana(combatant.combatantProperties, -payload.mp);

  actionCommandManager.processNextCommand();
}
