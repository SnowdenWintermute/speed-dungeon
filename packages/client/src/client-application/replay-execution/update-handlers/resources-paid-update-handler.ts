import { MaxAndCurrent, ResourcesPaidGameUpdateCommand } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { ReplayGameUpdateTracker } from "../replay-game-update-completion-tracker";

export async function resourcesPaidGameUpdateHandler(
  clientApplication: ClientApplication,
  update: ReplayGameUpdateTracker<ResourcesPaidGameUpdateCommand>
) {
  const { command } = update;
  const combatant = clientApplication.gameContext.requireCombatant(command.combatantId);
  const { combatantProperties } = combatant;

  if (command.itemsConsumed !== undefined) {
    for (const itemId of command.itemsConsumed) {
      combatantProperties.inventory.removeItem(itemId);
    }
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
}
