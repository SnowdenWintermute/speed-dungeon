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

// Create discriminated union
export type ClientIntent = {
  [K in keyof ClientIntentMap]: {
    type: K;
    data: ClientIntentMap[K];
  };
}[keyof ClientIntentMap];

type ClientIntentHandler<K extends keyof ClientIntentMap> = (intent: ClientIntentMap[K]) => void;

type IntentHandlers = {
  [K in keyof ClientIntentMap]: ClientIntentHandler<K>;
};

function handleRequestToJoinGame(data: { gameName: string }) {
  return;
}

const intentHandlers: IntentHandlers = {
  [ClientIntentType.RequestToJoinGame]: handleRequestToJoinGame,
  [ClientIntentType.RequestsGameList]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.CreateGame]: function (intent: {
    gameName: string;
    mode: GameMode;
    isRanked?: boolean;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.JoinGame]: function (intent: { gameName: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.LeaveGame]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.CreateParty]: function (intent: { partyName: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.JoinParty]: function (intent: { partyName: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.LeaveParty]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.ToggleReadyToStartGame]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.CreateCharacter]: function (intent: {
    name: string;
    combatantClass: CombatantClass;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.DeleteCharacter]: function (intent: { characterId: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.SelectCombatAction]: function (intent: {
    characterId: string;
    actionAndRankOption: null | ActionAndRank;
    itemIdOption?: string;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.IncrementAttribute]: function (intent: {
    characterId: string;
    attribute: CombatAttribute;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.ToggleReadyToExplore]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.UnequipSlot]: function (intent: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.EquipInventoryItem]: function (intent: {
    characterId: string;
    itemId: string;
    equipToAltSlot: boolean;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.CycleCombatActionTargets]: function (intent: {
    characterId: string;
    direction: NextOrPrevious;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.CycleTargetingSchemes]: function (intent: { characterId: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.UseSelectedCombatAction]: function (intent: { characterId: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.DropEquippedItem]: function (intent: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.DropItem]: function (intent: { characterId: string; itemId: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.ToggleReadyToDescend]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate]: function (intent: {
    itemId: string;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.PickUpItems]: function (intent: { characterAndItem: CharacterAndItems }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.GetSavedCharactersList]: function (intent: never): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.GetSavedCharacterById]: function (intent: { entityId: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.CreateSavedCharacter]: function (intent: {
    name: string;
    combatantClass: CombatantClass;
    slotNumber: number;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.DeleteSavedCharacter]: function (intent: { entityId: string }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.SelectSavedCharacterForProgressGame]: function (intent: {
    entityId: string;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.SelectProgressionGameStartingFloor]: function (intent: {
    floor: number;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.SelectHoldableHotswapSlot]: function (intent: {
    characterId: string;
    slotIndex: number;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.ConvertItemsToShards]: function (intent: {
    characterAndItems: CharacterAndItems;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.DropShards]: function (intent: {
    characterId: string;
    numShards: number;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.PurchaseItem]: function (intent: {
    characterId: EntityId;
    consumableType: ConsumableType;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.PerformCraftingAction]: function (intent: {
    characterId: EntityId;
    itemId: EntityId;
    craftingAction: CraftingAction;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.PostItemLink]: function (intent: { itemId: EntityId }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.SelectCombatActionLevel]: function (intent: {
    characterId: EntityId;
    actionLevel: number;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.AllocateAbilityPoint]: function (intent: {
    characterId: EntityId;
    ability: AbilityTreeAbility;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.TradeItemForBook]: function (intent: {
    characterId: EntityId;
    itemId: EntityId;
    bookType: BookConsumableType;
  }): void {
    throw new Error("Function not implemented.");
  },
  [ClientIntentType.RenamePet]: function (intent: { petId: EntityId; newName: string }): void {
    throw new Error("Function not implemented.");
  },
};

export function handleClientIntent(intent: ClientIntent): void {
  intentHandlers[intent.type](intent.data as never);
}
