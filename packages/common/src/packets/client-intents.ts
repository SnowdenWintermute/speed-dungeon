import { AbilityTreeAbility } from "../abilities/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantClass } from "../combatants/index.js";
import { BookConsumableType, ConsumableType } from "../items/consumables/index.js";
import { CraftingAction } from "../items/crafting/crafting-actions.js";
import { TaggedEquipmentSlot } from "../items/equipment/slots.js";
import { EntityId, NextOrPrevious } from "../primatives/index.js";
import { GameMode } from "../types.js";
import { CharacterAndItems } from "./server-to-client.js";

export enum ClientIntentType {
  RequestToJoinGame,
  RequestsGameList,
  CreateGame,
  JoinGame,
  LeaveGame,
  CreateParty,
  JoinParty,
  LeaveParty,
  ToggleReadyToStartGame,
  CreateCharacter,
  DeleteCharacter,
  SelectCombatAction,
  IncrementAttribute,
  ToggleReadyToExplore,
  UnequipSlot,
  EquipInventoryItem,
  CycleCombatActionTargets,
  CycleTargetingSchemes,
  UseSelectedCombatAction,
  DropEquippedItem,
  DropItem,
  ToggleReadyToDescend,
  AcknowledgeReceiptOfItemOnGroundUpdate,
  PickUpItems,
  GetSavedCharactersList,
  GetSavedCharacterById,
  CreateSavedCharacter,
  DeleteSavedCharacter,
  SelectSavedCharacterForProgressGame,
  SelectProgressionGameStartingFloor,
  SelectHoldableHotswapSlot,
  ConvertItemsToShards,
  DropShards,
  PurchaseItem,
  PerformCraftingAction,
  PostItemLink,
  SelectCombatActionLevel,
  AllocateAbilityPoint,
  TradeItemForBook,
  RenamePet,
}

// Map enum values to payload types
interface ClientIntentMap {
  [ClientIntentType.RequestToJoinGame]: { gameName: string };
  [ClientIntentType.RequestsGameList]: never;
  [ClientIntentType.CreateGame]: {
    gameName: string;
    mode: GameMode;
    isRanked?: boolean;
  };
  [ClientIntentType.JoinGame]: { gameName: string };
  [ClientIntentType.LeaveGame]: never;
  [ClientIntentType.CreateParty]: { partyName: string };
  [ClientIntentType.JoinParty]: { partyName: string };
  [ClientIntentType.LeaveParty]: never;
  [ClientIntentType.ToggleReadyToStartGame]: never;
  [ClientIntentType.CreateCharacter]: {
    name: string;
    combatantClass: CombatantClass;
  };
  [ClientIntentType.DeleteCharacter]: { characterId: string };
  [ClientIntentType.SelectCombatAction]: {
    characterId: string;
    actionAndRankOption: null | ActionAndRank;
    itemIdOption?: string;
  };
  [ClientIntentType.IncrementAttribute]: {
    characterId: string;
    attribute: CombatAttribute;
  };
  [ClientIntentType.ToggleReadyToExplore]: never;
  [ClientIntentType.UnequipSlot]: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  };
  [ClientIntentType.EquipInventoryItem]: {
    characterId: string;
    itemId: string;
    equipToAltSlot: boolean;
  };
  [ClientIntentType.CycleCombatActionTargets]: {
    characterId: string;
    direction: NextOrPrevious;
  };
  [ClientIntentType.CycleTargetingSchemes]: { characterId: string };
  [ClientIntentType.UseSelectedCombatAction]: { characterId: string };
  [ClientIntentType.DropEquippedItem]: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  };
  [ClientIntentType.DropItem]: { characterId: string; itemId: string };
  [ClientIntentType.ToggleReadyToDescend]: never;
  [ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate]: { itemId: string };
  [ClientIntentType.PickUpItems]: { characterAndItem: CharacterAndItems };
  [ClientIntentType.GetSavedCharactersList]: never;
  [ClientIntentType.GetSavedCharacterById]: { entityId: string };
  [ClientIntentType.CreateSavedCharacter]: {
    name: string;
    combatantClass: CombatantClass;
    slotNumber: number;
  };
  [ClientIntentType.DeleteSavedCharacter]: { entityId: string };
  [ClientIntentType.SelectSavedCharacterForProgressGame]: { entityId: string };
  [ClientIntentType.SelectProgressionGameStartingFloor]: { floor: number };
  [ClientIntentType.SelectHoldableHotswapSlot]: {
    characterId: string;
    slotIndex: number;
  };
  [ClientIntentType.ConvertItemsToShards]: { characterAndItems: CharacterAndItems };
  [ClientIntentType.DropShards]: { characterId: string; numShards: number };
  [ClientIntentType.PurchaseItem]: {
    characterId: EntityId;
    consumableType: ConsumableType;
  };
  [ClientIntentType.PerformCraftingAction]: {
    characterId: EntityId;
    itemId: EntityId;
    craftingAction: CraftingAction;
  };
  [ClientIntentType.PostItemLink]: { itemId: EntityId };
  [ClientIntentType.SelectCombatActionLevel]: {
    characterId: EntityId;
    actionLevel: number;
  };
  [ClientIntentType.AllocateAbilityPoint]: {
    characterId: EntityId;
    ability: AbilityTreeAbility;
  };
  [ClientIntentType.TradeItemForBook]: {
    characterId: EntityId;
    itemId: EntityId;
    bookType: BookConsumableType;
  };
  [ClientIntentType.RenamePet]: { petId: EntityId; newName: string };
}

export type ClientIntent = {
  [K in keyof ClientIntentMap]: {
    type: K;
    data: ClientIntentMap[K];
  };
}[keyof ClientIntentMap];

// // Usage
// const testEvent: ClientIntent = {
//   type: ClientIntentType.DropItem,
//   data: { characterId: "", itemId: "" },
// };
