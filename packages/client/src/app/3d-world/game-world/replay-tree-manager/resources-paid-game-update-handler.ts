import {
  ActionPayableResource,
  CombatantProperties,
  ERROR_MESSAGES,
  Inventory,
  ResourcesPaidGameUpdateCommand,
  SpeedDungeonGame,
  iterateNumericEnumKeyedRecord,
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

    if (command.costsPaid) {
      CombatantProperties.payResourceCosts(combatantProperties, command.costsPaid);
    }
  });

  update.isComplete = true;
}
