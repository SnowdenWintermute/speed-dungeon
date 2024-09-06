import {
  CombatantAssociatedData,
  CombatantProperties,
  Inventory,
  PayAbilityCostsActionCommandPayload,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { combatantAssociatedDataProvider } from "../WebsocketManager/combatant-associated-details-providers";

export default function payAbilityCostsActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  entityId: string,
  payload: PayAbilityCostsActionCommandPayload
) {
  this.mutateGameState((state) => {
    console.log(state.testText);
    console.log("trying to modify");
    state.testText = "trying to modify";
    console.log("test text says: ", state.testText);
  });

  combatantAssociatedDataProvider(
    this.mutateGameState,
    this.mutateAlertState,
    entityId,
    (combatantAssociatedData: CombatantAssociatedData) => handler(combatantAssociatedData, payload)
  );
}

// CLIENT
// - apply ability costs to game
// - process the next command

function handler(
  combatantAssociatedData: CombatantAssociatedData,
  payload: PayAbilityCostsActionCommandPayload
) {
  const { party, combatant } = combatantAssociatedData;
  for (const itemId of payload.itemIds) {
    Inventory.removeItem(combatant.combatantProperties.inventory, itemId);
  }
  if (payload.hp) CombatantProperties.changeHitPoints(combatant.combatantProperties, payload.hp);
  console.log("paying mp cost");
  if (payload.mp) CombatantProperties.changeMana(combatant.combatantProperties, -10);
  combatant.combatantProperties.mana = 0;

  party.actionCommandManager.processNextCommand();
}
