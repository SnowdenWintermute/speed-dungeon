// import { ClientIntentMap, ClientIntentType } from "../packets/client-intents.js";
// import { Lobby } from "./index.js";
// import { GameStateUpdateDispatchOutbox } from "./update-delivery/update-dispatch-outbox.js";
// import { UserSession } from "./sessions/user-session.js";

// export type ClientIntentHandler<K extends keyof ClientIntentMap> = (
//   data: ClientIntentMap[K],
//   user: UserSession
// ) => GameStateUpdateDispatchOutbox | Promise<GameStateUpdateDispatchOutbox>;

// export type LobbyClientIntentHandlers = {
//   [K in keyof ClientIntentMap]: ClientIntentHandler<K>;
// };

// export function createGameServerClientIntentHandlers(
//   lobby: Lobby
// ): Partial<LobbyClientIntentHandlers> {
//   return {
//     // // CONNECTIONS
//     // Connection
//     // Disconnection,
//     // LeaveGame,
//     //
//     // // ACTION SELECTION
//     // SelectCombatAction,
//     // SelectCombatActionLevel,
//     // CycleCombatActionTargets,
//     // CycleTargetingSchemes,
//     // UseSelectedCombatAction,
//     //
//     // // CHARACTER PROGRESSION
//     // IncrementAttribute,
//     // AllocateAbilityPoint,
//     //
//     // // DUNGEON EXPLORATION
//     // ToggleReadyToExplore,
//     // ToggleReadyToDescend,
//     //
//     // // EQUIPMENT
//     // UnequipSlot,
//     // SelectHoldableHotswapSlot,
//     // EquipInventoryItem,
//     //
//     // // ITEM MANAGEMENT
//     // DropEquippedItem,
//     // DropItem,
//     // AcknowledgeReceiptOfItemOnGroundUpdate,
//     // PickUpItems,
//     //
//     // // crafting and trading
//     // ConvertItemsToShards,
//     // DropShards,
//     // PurchaseItem,
//     // PerformCraftingAction,
//     // TradeItemForBook,
//     //
//     // // MISC UTILITY
//     // PostItemLink,
//     // RenamePet,
//   };
// }
