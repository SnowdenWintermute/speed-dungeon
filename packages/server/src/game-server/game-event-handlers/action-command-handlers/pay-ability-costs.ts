import {
  CombatantProperties,
  Inventory,
  PayAbilityCostsActionCommandPayload,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";

// SERVER
// - apply ability costs to game
// - process the next command
export async function payAbilityCostsActionCommandHandler(
  this: GameServer,
  gameName: string,
  entityId: string,
  payload: PayAbilityCostsActionCommandPayload
) {
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, entityId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { combatant } = actionAssociatedDataResult;

  for (const itemId of payload.itemIds) {
    Inventory.removeConsumable(combatant.combatantProperties.inventory, itemId);
    Inventory.removeEquipment(combatant.combatantProperties.inventory, itemId);
  }
  if (payload.hp) CombatantProperties.changeHitPoints(combatant.combatantProperties, -payload.hp);
  if (payload.mp) CombatantProperties.changeMana(combatant.combatantProperties, -payload.mp);
}
