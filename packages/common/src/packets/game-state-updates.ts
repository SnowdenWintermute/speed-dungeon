import { DungeonRoom, DungeonRoomType, ExplorationAction } from "../adventuring-party/index.js";
import { Battle, BattleConclusion } from "../battle/index.js";
import { ActionCommandPayload } from "../action-processing/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Item } from "../items/index.js";
import { EntityId, NextOrPrevious } from "../primatives/index.js";
import { Combatant } from "../combatants/index.js";
import { GameMessage } from "./game-message.js";
import { UserChannelDisplayData } from "../users/index.js";
import { GameMode } from "../types.js";
import { TaggedEquipmentSlot } from "../items/equipment/slots.js";
import { Consumable } from "../items/consumables/index.js";
import { CraftingAction } from "../items/crafting/crafting-actions.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";

export enum ServerToClientEvent {
  GameList,
  ClientUsername,
  ChannelFullUpdate,
  UserJoinedChannel,
  UserLeftChannel,
  ErrorMessage,
  GameFullUpdate,
  PartyNameUpdate,
  PlayerChangedAdventuringParty,
  PlayerLeftGame,
  PlayerJoinedGame,
  PartyCreated,
  CharacterAddedToParty,
  CharacterDeleted,
  PlayerToggledReadyToStartGame,
  GameStarted,
  PlayerToggledReadyToDescendOrExplore,
  DungeonRoomTypesOnCurrentFloor,
  DungeonRoomUpdate,
  BattleFullUpdate,
  ActionCommandPayloads,
  GameMessage,
  // BattleReport ,
  CharacterDroppedItem,
  CharacterDroppedEquippedItem,
  CharacterUnequippedItem,
  CharacterEquippedItem,
  CharacterPickedUpItems,
  // RawActionResults ,
  CharacterSelectedCombatAction,
  CharacterCycledTargets,
  CharacterCycledTargetingSchemes,
  DungeonFloorNumber,
  CharacterSpentAttributePoint,
  SavedCharacterList,
  SavedCharacter,
  SavedCharacterDeleted,
  PlayerSelectedSavedCharacterInProgressionGame,
  ProgressionGameStartingFloorSelected,
  CharacterSelectedHoldableHotswapSlot,
  CharacterConvertedItemsToShards,
  CharacterDroppedShards,
  CharacterPurchasedItem,
  CharacterPerformedCraftingAction,
  PlayerPostedItemLink,
  // ActionResultReplayTree ,
  CharacterSelectedCombatActionLevel,
  CharacterAllocatedAbilityPoint,
  CharacterTradedItemForBook,
  CharacterRenamedPet,
}

export interface GameStateUpdateMap {
  [ServerToClientEvent.GameList]: {
    gameList: GameListEntry[];
  };
  [ServerToClientEvent.ClientUsername]: {
    username: string;
  };
  [ServerToClientEvent.ChannelFullUpdate]: {
    channelName: string;
    users: { username: string; userChannelDisplayData: UserChannelDisplayData }[];
  };
  [ServerToClientEvent.UserJoinedChannel]: {
    username: string;
    userChannelDisplayData: UserChannelDisplayData;
  };
  [ServerToClientEvent.UserLeftChannel]: {
    username: string;
  };
  [ServerToClientEvent.ErrorMessage]: {
    message: string;
  };
  [ServerToClientEvent.GameFullUpdate]: {
    game: SpeedDungeonGame | null;
  };
  [ServerToClientEvent.PartyNameUpdate]: {
    partyName: string | null;
  };
  [ServerToClientEvent.PlayerChangedAdventuringParty]: {
    playerName: string;
    partyName: string | null;
  };
  [ServerToClientEvent.PlayerLeftGame]: {
    username: string;
  };
  [ServerToClientEvent.PlayerJoinedGame]: {
    username: string;
  };
  [ServerToClientEvent.PartyCreated]: {
    partyId: string;
    partyName: string;
  };
  [ServerToClientEvent.CharacterAddedToParty]: {
    username: string;
    character: Combatant;
    pets: Combatant[];
  };
  [ServerToClientEvent.CharacterDeleted]: {
    username: string;
    characterId: string;
  };
  [ServerToClientEvent.PlayerToggledReadyToStartGame]: {
    username: string;
  };
  [ServerToClientEvent.GameStarted]: {
    timeStarted: number;
  };
  [ServerToClientEvent.PlayerToggledReadyToDescendOrExplore]: {
    characterId: string;
    explorationAction: ExplorationAction;
  };
  [ServerToClientEvent.DungeonRoomTypesOnCurrentFloor]: {
    roomTypes: (DungeonRoomType | null)[];
  };
  [ServerToClientEvent.DungeonRoomUpdate]: {
    dungeonRoom: DungeonRoom;
    monsters: Combatant[];
    actionEntitiesToRemove: EntityId[];
  };
  [ServerToClientEvent.BattleFullUpdate]: {
    battle: Battle | null;
  };
  [ServerToClientEvent.ActionCommandPayloads]: {
    payloads: ActionCommandPayload[];
  };
  [ServerToClientEvent.GameMessage]: {
    message: GameMessage;
  };
  [ServerToClientEvent.CharacterDroppedItem]: {
    characterAndItem: CharacterAndItem;
  };
  [ServerToClientEvent.CharacterDroppedEquippedItem]: {
    characterAndItem: CharacterAndSlot;
  };
  [ServerToClientEvent.CharacterUnequippedItem]: {
    characterAndItem: CharacterAndSlot;
  };
  [ServerToClientEvent.CharacterEquippedItem]: {
    itemId: string;
    equipToAlternateSlot: boolean;
    characterId: string;
  };
  [ServerToClientEvent.CharacterPickedUpItems]: {
    characterAndItems: CharacterAndItems;
  };
  [ServerToClientEvent.CharacterSelectedCombatAction]: {
    characterId: string;
    actionAndRankOption: ActionAndRank | null;
    itemIdOption?: string | null;
  };
  [ServerToClientEvent.CharacterCycledTargets]: {
    characterId: string;
    direction: NextOrPrevious;
    playerUsername: string;
  };
  [ServerToClientEvent.CharacterCycledTargetingSchemes]: {
    characterId: string;
    playerUsername: string;
  };
  [ServerToClientEvent.DungeonFloorNumber]: {
    floor: number;
  };
  [ServerToClientEvent.CharacterSpentAttributePoint]: {
    characterId: string;
    attribute: CombatAttribute;
  };
  [ServerToClientEvent.SavedCharacterList]: {
    characterSlots: {
      [slot: number]: null | { combatant: Combatant; pets: Combatant[] };
    };
  };
  [ServerToClientEvent.SavedCharacter]: {
    character: { combatant: Combatant; pets: Combatant[] };
    slot: number;
  };
  [ServerToClientEvent.SavedCharacterDeleted]: {
    id: string;
  };
  [ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame]: {
    username: string;
    character: { combatant: Combatant; pets: Combatant[] };
  };
  [ServerToClientEvent.ProgressionGameStartingFloorSelected]: {
    floor: number;
  };
  [ServerToClientEvent.CharacterSelectedHoldableHotswapSlot]: {
    characterId: string;
    slotIndex: number;
  };
  [ServerToClientEvent.CharacterConvertedItemsToShards]: {
    characterAndItems: CharacterAndItems;
  };
  [ServerToClientEvent.CharacterDroppedShards]: {
    characterId: string;
    shardStack: Consumable;
  };
  [ServerToClientEvent.CharacterPurchasedItem]: {
    characterId: EntityId;
    item: Consumable;
    price: number;
  };
  [ServerToClientEvent.CharacterPerformedCraftingAction]: {
    characterId: EntityId;
    item: Item;
    craftingAction: CraftingAction;
  };
  [ServerToClientEvent.PlayerPostedItemLink]: {
    username: string;
    itemId: EntityId;
  };
  [ServerToClientEvent.CharacterSelectedCombatActionLevel]: {
    characterId: EntityId;
    actionLevel: number;
  };
  [ServerToClientEvent.CharacterAllocatedAbilityPoint]: {
    characterId: EntityId;
    ability: AbilityTreeAbility;
  };
  [ServerToClientEvent.CharacterTradedItemForBook]: {
    characterId: EntityId;
    itemIdTraded: EntityId;
    book: Consumable;
  };
  [ServerToClientEvent.CharacterRenamedPet]: {
    petId: EntityId;
    newName: string;
  };
}

export type GameStateUpdate = {
  [K in keyof GameStateUpdateMap]: {
    type: K;
    data: GameStateUpdateMap[K];
  };
}[keyof GameStateUpdateMap];

type GameStateUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type GameStateUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: GameStateUpdateHandler<K>;
};

export interface CharacterAndItem {
  characterId: string;
  itemId: string;
}

export interface CharacterAndItems {
  characterId: string;
  itemIds: string[];
}

export interface CharacterAndSlot {
  characterId: string;
  slot: TaggedEquipmentSlot;
}

export class GameListEntry {
  constructor(
    public gameName: string,
    public numberOfUsers: number,
    public gameMode: GameMode,
    public timeStarted: null | number,
    public isRanked: boolean
  ) {}
}

export class BattleReport {
  constructor(
    public conclusion: BattleConclusion,
    public loot: Item[] = [],
    public expChanges: { combatantId: string; experienceChange: number }[] = []
  ) {}
}
