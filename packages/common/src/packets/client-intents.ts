import { AbilityTreeAbility } from "../abilities/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import {
  ActionRank,
  CharacterSlotIndex,
  CombatantId,
  EntityId,
  EntityName,
  GameName,
  ItemId,
  PartyName,
} from "../aliases.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { BookConsumableType } from "../items/consumables/index.js";
import { CraftingAction } from "../items/crafting/crafting-actions.js";
import { TaggedEquipmentSlot } from "../items/equipment/slots.js";
import { NextOrPrevious } from "../primatives/index.js";
import { GameMode } from "../types.js";
import { CharacterAndItem, CharacterAndItems } from "./game-state-updates.js";

export enum ClientIntentType {
  // lobby
  RequestsGameList,
  // game setup
  CreateGame,
  JoinGame,
  LeaveGame,
  ToggleReadyToStartGame,
  // party setup
  CreateParty,
  JoinParty,
  LeaveParty,
  CreateCharacter,
  DeleteCharacter,
  SelectSavedCharacterForProgressGame,
  SelectProgressionGameStartingFloor,
  // saved character managment
  GetSavedCharactersList,
  CreateSavedCharacter,
  DeleteSavedCharacter,

  // action selection
  SelectCombatAction,
  SelectCombatActionRank,
  CycleCombatActionTargets,
  CycleTargetingSchemes,
  UseSelectedCombatAction,

  // character progression
  IncrementAttribute,
  AllocateAbilityPoint,

  // dungeon exploration
  ToggleReadyToExplore,
  ToggleReadyToDescend,

  // equipment
  UnequipSlot,
  SelectHoldableHotswapSlot,
  EquipInventoryItem,

  // item management
  DropEquippedItem,
  DropItem,
  AcknowledgeReceiptOfItemOnGroundUpdate,
  PickUpItems,

  // crafting and trading
  ConvertItemsToShards,
  DropShards,
  PurchaseItem,
  PerformCraftingAction,
  TradeItemForBook,

  // misc utility
  PostItemLink,
  RenamePet,
}

// Map enum values to payload types
export interface ClientIntentMap {
  [ClientIntentType.RequestsGameList]: undefined;
  [ClientIntentType.CreateGame]: {
    gameName: GameName;
    mode: GameMode;
    isRanked?: boolean;
  };
  [ClientIntentType.JoinGame]: { gameName: GameName };
  [ClientIntentType.LeaveGame]: undefined;
  [ClientIntentType.CreateParty]: { partyName: PartyName };
  [ClientIntentType.JoinParty]: { partyName: PartyName };
  [ClientIntentType.LeaveParty]: undefined;
  [ClientIntentType.ToggleReadyToStartGame]: undefined;
  [ClientIntentType.CreateCharacter]: {
    name: EntityName;
    combatantClass: CombatantClass;
  };
  [ClientIntentType.DeleteCharacter]: { characterId: CombatantId };
  [ClientIntentType.SelectCombatAction]: {
    characterId: CombatantId;
    actionAndRankOption: null | ActionAndRank;
    itemIdOption?: EntityId;
  };
  [ClientIntentType.IncrementAttribute]: {
    characterId: CombatantId;
    attribute: CombatAttribute;
  };
  [ClientIntentType.ToggleReadyToExplore]: undefined;
  [ClientIntentType.UnequipSlot]: {
    characterId: CombatantId;
    slot: TaggedEquipmentSlot;
  };
  [ClientIntentType.EquipInventoryItem]: {
    characterId: CombatantId;
    itemId: ItemId;
    equipToAlternateSlot: boolean;
  };
  [ClientIntentType.CycleCombatActionTargets]: {
    characterId: CombatantId;
    direction: NextOrPrevious;
  };
  [ClientIntentType.CycleTargetingSchemes]: { characterId: CombatantId };
  [ClientIntentType.UseSelectedCombatAction]: { characterId: CombatantId };
  [ClientIntentType.DropEquippedItem]: {
    characterId: CombatantId;
    slot: TaggedEquipmentSlot;
  };
  [ClientIntentType.DropItem]: CharacterAndItem;
  [ClientIntentType.ToggleReadyToDescend]: undefined;
  [ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate]: { itemId: string };
  [ClientIntentType.PickUpItems]: CharacterAndItems;
  [ClientIntentType.GetSavedCharactersList]: undefined;
  [ClientIntentType.CreateSavedCharacter]: {
    name: EntityName;
    combatantClass: CombatantClass;
    slotIndex: CharacterSlotIndex;
  };
  [ClientIntentType.DeleteSavedCharacter]: { entityId: CombatantId };
  [ClientIntentType.SelectSavedCharacterForProgressGame]: { entityId: CombatantId };
  [ClientIntentType.SelectProgressionGameStartingFloor]: { floorNumber: number };
  [ClientIntentType.SelectHoldableHotswapSlot]: {
    characterId: CombatantId;
    slotIndex: number;
  };
  [ClientIntentType.ConvertItemsToShards]: CharacterAndItems;
  [ClientIntentType.DropShards]: { characterId: CombatantId; shardCount: number };
  [ClientIntentType.PurchaseItem]: {
    characterId: CombatantId;
    consumableType: ConsumableType;
  };
  [ClientIntentType.PerformCraftingAction]: {
    characterId: CombatantId;
    itemId: ItemId;
    craftingAction: CraftingAction;
  };
  [ClientIntentType.PostItemLink]: { itemId: ItemId };
  [ClientIntentType.SelectCombatActionRank]: {
    characterId: CombatantId;
    actionRank: ActionRank;
  };
  [ClientIntentType.AllocateAbilityPoint]: {
    characterId: CombatantId;
    ability: AbilityTreeAbility;
  };
  [ClientIntentType.TradeItemForBook]: {
    characterId: CombatantId;
    itemId: ItemId;
    bookType: BookConsumableType;
  };
  [ClientIntentType.RenamePet]: { petId: CombatantId; newName: EntityName };
}

export type ClientIntent = {
  [K in keyof ClientIntentMap]: {
    type: K;
    data: ClientIntentMap[K];
  };
}[keyof ClientIntentMap];
