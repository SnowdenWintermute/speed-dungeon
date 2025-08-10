import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatantProperties,
  ERROR_MESSAGES,
  Inventory,
  MaxAndCurrent,
  ResourcesPaidGameUpdateCommand,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";

export async function resourcesPaidGameUpdateHandler(update: {
  command: ResourcesPaidGameUpdateCommand;
  isComplete: boolean;
}) {
  // deduct the resources
  // enqueue the floating text messages
  const { command } = update;
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const combatantResult = SpeedDungeonGame.getCombatantById(game, command.combatantId);
    if (combatantResult instanceof Error) return combatantResult;
    const { combatantProperties } = combatantResult;

    if (command.itemsConsumed !== undefined)
      for (const itemId of command.itemsConsumed)
        Inventory.removeItem(combatantProperties.inventory, itemId);

    if (command.costsPaid)
      CombatantProperties.payResourceCosts(combatantProperties, command.costsPaid);

    if (command.cooldownSet) {
      const actionState = combatantProperties.ownedActions[command.actionName];
      if (actionState === undefined) throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
      actionState.cooldown = new MaxAndCurrent(command.cooldownSet, command.cooldownSet);
    }
  });

  update.isComplete = true;
}
