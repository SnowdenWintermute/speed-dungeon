import { ClientIntentMap } from "../../packets/client-intents.js";
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
    // SelectCombatAction,
    // SelectCombatActionLevel,
    // CycleCombatActionTargets,
    // CycleTargetingSchemes,
    // UseSelectedCombatAction,
    //
    // // CHARACTER PROGRESSION
    // IncrementAttribute,
    // AllocateAbilityPoint,
    //
    // // DUNGEON EXPLORATION
    // ToggleReadyToExplore,
    // ToggleReadyToDescend,
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
