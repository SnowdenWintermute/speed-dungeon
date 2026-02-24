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
    // // DUNGEON EXPLORATION
    [ClientIntentType.ToggleReadyToExplore]: (_, user) =>
      gameServer.dungeonExplorationController.toggleReadyToExploreHandler(user),
    [ClientIntentType.ToggleReadyToDescend]: (_, user) =>
      gameServer.dungeonExplorationController.toggleReadyToDescendHandler(user),
    // // CHARACTER PROGRESSION
    [ClientIntentType.IncrementAttribute]: (data, user) =>
      gameServer.characterProgressionController.characterSpentAttributePointHandler(user, data),
    [ClientIntentType.AllocateAbilityPoint]: (data, user) =>
      gameServer.characterProgressionController.characterAllocatedAbilityPointHandler(user, data),
    // // ITEM MANAGEMENT
    [ClientIntentType.DropItem]: (data, user) =>
      gameServer.itemManagementController.dropItemHandler(user, data),
    [ClientIntentType.DropEquippedItem]: (data, user) =>
      gameServer.itemManagementController.dropEquippedItemHandler(user, data),
    [ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate]: (data, user) =>
      gameServer.itemManagementController.acknowledgeReceiptOfItemOnGroundHandler(user, data),
    [ClientIntentType.PickUpItems]: (data, user) =>
      gameServer.itemManagementController.pickUpItemsHandler(user, data),
    //
    // // EQUIPMENT
    // UnequipSlot,
    // SelectHoldableHotswapSlot,
    // EquipInventoryItem,
    //
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
