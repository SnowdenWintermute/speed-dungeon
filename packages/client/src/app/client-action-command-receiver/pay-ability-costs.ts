import {
  CombatantAssociatedData,
  CombatantProperties,
  Inventory,
  PayAbilityCostsActionCommandPayload,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { combatantAssociatedDataProvider } from "../WebsocketManager/combatant-associated-details-providers";

export default async function payAbilityCostsActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  entityId: string,
  payload: PayAbilityCostsActionCommandPayload
) {
  combatantAssociatedDataProvider(entityId, (combatantAssociatedData: CombatantAssociatedData) =>
    handler(combatantAssociatedData, payload)
  );
}

function handler(
  combatantAssociatedData: CombatantAssociatedData,
  payload: PayAbilityCostsActionCommandPayload
) {
  const { combatant } = combatantAssociatedData;
  for (const itemId of payload.itemIds) {
    Inventory.removeItem(combatant.combatantProperties.inventory, itemId);
  }
  if (payload.hp) CombatantProperties.changeHitPoints(combatant.combatantProperties, -payload.hp);
  if (payload.mp) CombatantProperties.changeMana(combatant.combatantProperties, -payload.mp);
}
