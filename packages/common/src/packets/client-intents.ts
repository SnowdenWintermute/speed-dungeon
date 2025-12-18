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
  // AssignAttributePoint , replaced by IncrementAttribute
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

export type ClientIntent =
  | {
      type: ClientIntentType.RequestToJoinGame;
      gameName: string;
    }
  | {
      type: ClientIntentType.RequestsGameList;
    }
  | {
      type: ClientIntentType.CreateGame;
      gameName: string;
      mode: GameMode;
      isRanked?: boolean;
    }
  | {
      type: ClientIntentType.JoinGame;
      gameName: string;
    }
  | {
      type: ClientIntentType.LeaveGame;
    }
  | {
      type: ClientIntentType.CreateParty;
      partyName: string;
    }
  | {
      type: ClientIntentType.JoinParty;
      partyName: string;
    }
  | {
      type: ClientIntentType.LeaveParty;
    }
  | {
      type: ClientIntentType.CreateCharacter;
      name: string;
      combatantClass: CombatantClass;
    }
  | {
      type: ClientIntentType.DeleteCharacter;
      characterId: EntityId;
    }
  | {
      type: ClientIntentType.SelectCombatAction;
      characterId: EntityId;
      actionAndRankOption: ActionAndRank | null;
      itemIdOption?: EntityId;
    }
  | {
      type: ClientIntentType.IncrementAttribute;
      characterId: EntityId;
      attribute: CombatAttribute;
    }
  | {
      type: ClientIntentType.ToggleReadyToExplore;
    }
  | {
      type: ClientIntentType.UnequipSlot;
      characterId: EntityId;
      slot: TaggedEquipmentSlot;
    }
  | {
      type: ClientIntentType.EquipInventoryItem;
      characterId: EntityId;
      itemId: EntityId;
      equipToAltSlot: boolean;
    }
  | {
      type: ClientIntentType.CycleCombatActionTargets;
      characterId: EntityId;
      direction: NextOrPrevious;
    }
  | {
      type: ClientIntentType.CycleTargetingSchemes;
      characterId: EntityId;
    }
  | {
      type: ClientIntentType.UseSelectedCombatAction;
      characterId: EntityId;
    }
  | {
      type: ClientIntentType.DropEquippedItem;
      characterId: EntityId;
      slot: TaggedEquipmentSlot;
    }
  | {
      type: ClientIntentType.DropItem;
      characterId: EntityId;
      itemId: EntityId;
    }
  | {
      type: ClientIntentType.ToggleReadyToDescend;
    }
  | {
      type: ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate;
      itemId: EntityId;
    }
  | {
      type: ClientIntentType.PickUpItems;
      characterAndItems: CharacterAndItems;
    }
  | {
      type: ClientIntentType.GetSavedCharactersList;
    }
  | {
      type: ClientIntentType.GetSavedCharacterById;
      entityId: EntityId;
    }
  | {
      type: ClientIntentType.CreateSavedCharacter;
      name: string;
      combatantClass: CombatantClass;
      slotNumber: number;
    }
  | {
      type: ClientIntentType.DeleteSavedCharacter;
      entityId: EntityId;
    }
  | {
      type: ClientIntentType.SelectSavedCharacterForProgressGame;
      entityId: EntityId;
    }
  | {
      type: ClientIntentType.SelectProgressionGameStartingFloor;
      floor: number;
    }
  | {
      type: ClientIntentType.SelectHoldableHotswapSlot;
      characterId: EntityId;
      slotIndex: number;
    }
  | {
      type: ClientIntentType.ConvertItemsToShards;
      characterAndItems: CharacterAndItems;
    }
  | {
      type: ClientIntentType.DropShards;
      characterId: EntityId;
      numShards: number;
    }
  | {
      type: ClientIntentType.PurchaseItem;
      characterId: EntityId;
      consumableType: ConsumableType;
    }
  | {
      type: ClientIntentType.PerformCraftingAction;
      characterId: EntityId;
      itemId: EntityId;
      craftingAction: CraftingAction;
    }
  | {
      type: ClientIntentType.PostItemLink;
      itemId: EntityId;
    }
  | {
      type: ClientIntentType.SelectCombatActionLevel;
      characterId: EntityId;
      actionLevel: number;
    }
  | {
      type: ClientIntentType.AllocateAbilityPoint;
      characterId: EntityId;
      ability: AbilityTreeAbility;
    }
  | {
      type: ClientIntentType.TradeItemForBook;
      characterId: EntityId;
      itemId: EntityId;
      bookType: BookConsumableType;
    }
  | {
      type: ClientIntentType.RenamePet;
      petId: EntityId;
      newName: string;
    };
