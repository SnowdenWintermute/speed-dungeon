import {
  CombatantProperties,
  Inventory,
  MaxAndCurrent,
  ResourcesPaidGameUpdateCommand,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameUpdateTracker } from "./game-update-tracker";
import { AppStore } from "@/mobx-stores/app-store";

export async function resourcesPaidGameUpdateHandler(
  update: GameUpdateTracker<ResourcesPaidGameUpdateCommand>
) {
  // deduct the resources
  // enqueue the floating text messages
  const { command } = update;

  const game = AppStore.get().gameStore.getExpectedGame();
  const combatantResult = SpeedDungeonGame.getCombatantById(game, command.combatantId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;

  if (command.itemsConsumed !== undefined)
    for (const itemId of command.itemsConsumed)
      Inventory.removeItem(combatantProperties.inventory, itemId);

  if (command.costsPaid)
    CombatantProperties.payResourceCosts(combatantProperties, command.costsPaid);

  const actionState = combatantProperties.abilityProperties.ownedActions[command.actionName];
  if (actionState !== undefined) {
    actionState.wasUsedThisTurn = true;

    if (command.cooldownSet) {
      actionState.cooldown = new MaxAndCurrent(command.cooldownSet, command.cooldownSet);
    }
  }

  update.setAsQueuedToComplete();
}
