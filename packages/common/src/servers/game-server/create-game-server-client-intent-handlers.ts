import { ClientIntentMap, ClientIntentType } from "../../packets/client-intents.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { GameServer } from "./index.js";
import { UserSession } from "../sessions/user-session.js";

export type GameServerClientIntentHandler<K extends keyof ClientIntentMap> = (
  data: ClientIntentMap[K],
  user: UserSession
) => MessageDispatchOutbox<GameStateUpdate> | Promise<MessageDispatchOutbox<GameStateUpdate>>;

export type GameServerClientIntentHandlers = {
  [K in keyof ClientIntentMap]: GameServerClientIntentHandler<K>;
};

export function createGameServerClientIntentHandlers(
  gameServer: GameServer
): Partial<GameServerClientIntentHandlers> {
  return {
    // // CONNECTIONS
    // Connection
    // Disconnection,
    // LeaveGame,
    //
    // // ACTION SELECTION
    [ClientIntentType.SelectCombatAction]: (data, user) =>
      gameServer.combatActionController.selectCombatActionHandler(user, data),
    [ClientIntentType.SelectCombatActionRank]: (data, user) =>
      gameServer.combatActionController.selectCombatActionRankHandler(user, data),
    [ClientIntentType.CycleCombatActionTargets]: (data, user) =>
      gameServer.combatActionController.cycleTargetsHandler(user, data),
    [ClientIntentType.CycleTargetingSchemes]: (data, user) =>
      gameServer.combatActionController.cycleTargetingSchemesHandler(user, data),
    [ClientIntentType.UseSelectedCombatAction]: (data, user) =>
      gameServer.combatActionController.useSelectedCombatActionHandler(user, data),
    //
    // // DUNGEON EXPLORATION
    [ClientIntentType.ToggleReadyToExplore]: (_, user) =>
      gameServer.dungeonExplorationController.toggleReadyToExploreHandler(user),
    // ToggleReadyToDescend,
    //
    // // CHARACTER PROGRESSION
    // IncrementAttribute,
    // AllocateAbilityPoint,
    //
    // // EQUIPMENT
    // UnequipSlot,
    // SelectHoldableHotswapSlot,
    // EquipInventoryItem,
    //
    // // ITEM MANAGEMENT
    // DropEquippedItem,
    // DropItem,
    // AcknowledgeReceiptOfItemOnGroundUpdate,
    // PickUpItems,
    //
    // // crafting and trading
    // ConvertItemsToShards,
    // DropShards,
    // PurchaseItem,
    // PerformCraftingAction,
    // TradeItemForBook,
    //
    // // MISC UTILITY
    // PostItemLink,
    // RenamePet,
  };
}
