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
import { postActionUseMessageToCombatLog } from "@/app/game/combat-log/post-action-use-message-to-combat-log";

export async function resourcesPaidGameUpdateHandler(update: {
  command: ResourcesPaidGameUpdateCommand;
  isComplete: boolean;
}) {
  console.log("resourcesPaidGameUpdateHandler");
  // deduct the resources
  // enqueue the floating text messages
  const { command } = update;
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const combatantResult = SpeedDungeonGame.getCombatantById(game, command.combatantId);
    if (combatantResult instanceof Error) return combatantResult;
    const { combatantProperties } = combatantResult;

    console.log("about to call postActionUseMessageToCombatLog");
    postActionUseMessageToCombatLog(gameState, command);

    if (command.itemsConsumed !== undefined)
      for (const itemId of command.itemsConsumed)
        Inventory.removeItem(combatantProperties.inventory, itemId);

    if (command.costsPaid) {
      for (const [resource, cost] of iterateNumericEnumKeyedRecord(command.costsPaid)) {
        switch (resource) {
          case ActionPayableResource.HitPoints:
            CombatantProperties.changeHitPoints(combatantProperties, cost);
            break;
          case ActionPayableResource.Mana:
            CombatantProperties.changeMana(combatantProperties, cost);
            break;
          case ActionPayableResource.Shards:
          case ActionPayableResource.QuickActions:
        }
      }
    }
  });

  update.isComplete = true;
}
