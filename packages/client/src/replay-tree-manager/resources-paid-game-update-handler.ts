import { MaxAndCurrent, ResourcesPaidGameUpdateCommand } from "@speed-dungeon/common";
import { GameUpdateTracker } from "./game-update-tracker";
import { AppStore } from "@/mobx-stores/app-store";

export async function resourcesPaidGameUpdateHandler(
  update: GameUpdateTracker<ResourcesPaidGameUpdateCommand>
) {
  // deduct the resources
  // enqueue the floating text messages
  const { command } = update;

  const game = AppStore.get().gameStore.getExpectedGame();
  const combatantResult = game.getCombatantById(command.combatantId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;

  if (command.itemsConsumed !== undefined)
    for (const itemId of command.itemsConsumed) {
      combatantProperties.inventory.removeItem(itemId);
    }

  if (command.costsPaid) {
    combatantProperties.resources.payResourceCosts(command.costsPaid);
  }

  const actionState = combatantProperties.abilityProperties.getOwnedActionOption(
    command.actionName
  );
  if (actionState !== undefined) {
    actionState.wasUsedThisTurn = true;

    if (command.cooldownSet) {
      actionState.cooldown = new MaxAndCurrent(command.cooldownSet, command.cooldownSet);
    }
  }

  update.setAsQueuedToComplete();
}
