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
    [ClientIntentType.LeaveGame]: async (_, user) => {
      user.intentionallyClosed = true;
      const outbox = await gameServer.gameLifecycleController.leaveGameHandler(user);
      return outbox;
    },
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
    // DUNGEON EXPLORATION
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
    [ClientIntentType.PickUpItems]: (data, user) =>
      gameServer.itemManagementController.pickUpItemsHandler(user, data),
    // // EQUIPMENT
    [ClientIntentType.UnequipSlot]: (data, user) =>
      gameServer.itemManagementController.unequipSlotHandler(user, data),
    [ClientIntentType.SelectHoldableHotswapSlot]: (data, user) =>
      gameServer.itemManagementController.selectHoldableHotswapSlotHandler(user, data),
    [ClientIntentType.EquipInventoryItem]: (data, user) =>
      gameServer.itemManagementController.equipItemHandler(user, data),
    // // CRAFTING AND TRADING
    [ClientIntentType.ConvertItemsToShards]: (data, user) =>
      gameServer.craftingController.convertItemsToShardsHandler(user, data),
    [ClientIntentType.DropShards]: (data, user) =>
      gameServer.craftingController.dropShardsHandler(user, data),
    [ClientIntentType.PurchaseItem]: (data, user) =>
      gameServer.craftingController.purchaseItemHandler(user, data),
    [ClientIntentType.PerformCraftingAction]: (data, user) =>
      gameServer.craftingController.craftItemHandler(user, data),
    [ClientIntentType.TradeItemForBook]: (data, user) =>
      gameServer.craftingController.tradeItemForBookHandler(user, data),
    // // MISC UTILITY
    [ClientIntentType.PostItemLink]: (data, user) =>
      gameServer.miscUtilityController.postItemLinkHandler(user, data),
    [ClientIntentType.RenamePet]: (data, user) =>
      gameServer.miscUtilityController.renamePetHandler(user, data),
  };
}
