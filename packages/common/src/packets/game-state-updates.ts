import { Battle, BattleConclusion } from "../battle/index.js";
import { ActionCommandPayload } from "../action-processing/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Item } from "../items/index.js";
import { NextOrPrevious } from "../primatives/index.js";
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
import {
  ChannelName,
  CharacterSlotIndex,
  CombatantId,
  EntityId,
  GameName,
  GuestSessionReconnectionToken,
  PartyName,
  Username,
} from "../aliases.js";
import { ExplorationAction } from "../adventuring-party/dungeon-exploration-manager.js";
import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { GameServerConnectionInstructions } from "../servers/lobby-server/game-handoff/connection-instructions.js";

export enum GameStateUpdateType {
  GameList,
  OnConnection,
  CacheGuestSessionReconnectionToken,
  ChannelFullUpdate,
  UserJoinedChannel,
  UserLeftChannel,
  ErrorMessage,
  GameFullUpdate,
  PartyNameUpdate,
  PlayerChangedAdventuringParty,
  PlayerLeftGame,
  PlayerJoinedGame,
  PlayerDisconnectedWithReconnectionOpportunity,
  PlayerReconnectionTimedOut,
  PartyCreated,
  CharacterAddedToParty,
  CharacterDeleted,
  PlayerToggledReadyToStartGame,
  GameStarted,
  GameServerConnectionInstructions,

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
  CharacterSelectedCombatActionRank,
  CharacterAllocatedAbilityPoint,
  CharacterTradedItemForBook,
  CharacterRenamedPet,
}

export interface GameStateUpdateMap {
  [GameStateUpdateType.GameList]: {
    gameList: GameListEntry[];
  };
  [GameStateUpdateType.OnConnection]: {
    username: Username;
    expiredReconnection?: boolean;
  };
  [GameStateUpdateType.CacheGuestSessionReconnectionToken]: {
    token: GuestSessionReconnectionToken;
  };
  [GameStateUpdateType.ChannelFullUpdate]: {
    channelName: ChannelName;
    users: Map<Username, UserChannelDisplayData>;
  };
  [GameStateUpdateType.UserJoinedChannel]: {
    username: Username;
    userChannelDisplayData: UserChannelDisplayData;
  };
  [GameStateUpdateType.UserLeftChannel]: {
    username: Username;
  };
  [GameStateUpdateType.ErrorMessage]: {
    message: string;
  };
  [GameStateUpdateType.GameFullUpdate]: {
    game: SpeedDungeonGame | null;
  };
  [GameStateUpdateType.PartyNameUpdate]: {
    partyName: PartyName | null;
  };
  [GameStateUpdateType.PlayerChangedAdventuringParty]: {
    playerName: Username;
    partyName: PartyName | null;
  };
  [GameStateUpdateType.PlayerLeftGame]: {
    username: Username;
  };
  [GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity]: {
    username: Username;
  };
  [GameStateUpdateType.PlayerReconnectionTimedOut]: {
    username: Username;
  };
  [GameStateUpdateType.PlayerJoinedGame]: {
    username: Username;
  };
  [GameStateUpdateType.PartyCreated]: {
    partyId: string;
    partyName: PartyName;
  };
  [GameStateUpdateType.CharacterAddedToParty]: {
    username: Username;
    character: Combatant;
    pets: Combatant[];
  };
  [GameStateUpdateType.CharacterDeleted]: {
    username: Username;
    characterId: string;
  };
  [GameStateUpdateType.PlayerToggledReadyToStartGame]: {
    username: Username;
  };
  [GameStateUpdateType.GameStarted]: {
    timeStarted: number;
  };
  [GameStateUpdateType.GameServerConnectionInstructions]: {
    connectionInstructions: GameServerConnectionInstructions;
  };
  [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]: {
    username: Username;
    explorationAction: ExplorationAction;
  };
  [GameStateUpdateType.DungeonRoomTypesOnCurrentFloor]: {
    roomTypes: (DungeonRoomType | null)[];
  };
  [GameStateUpdateType.DungeonRoomUpdate]: {
    dungeonRoom: DungeonRoom;
    monsters: Combatant[];
    actionEntitiesToRemove: EntityId[];
  };
  [GameStateUpdateType.BattleFullUpdate]: {
    battle: Battle | null;
  };
  [GameStateUpdateType.ActionCommandPayloads]: {
    payloads: ActionCommandPayload[];
  };
  [GameStateUpdateType.GameMessage]: {
    message: GameMessage;
  };
  [GameStateUpdateType.CharacterDroppedItem]: CharacterAndItem;
  [GameStateUpdateType.CharacterDroppedEquippedItem]: CharacterAndSlot;
  [GameStateUpdateType.CharacterUnequippedItem]: CharacterAndSlot;
  [GameStateUpdateType.CharacterEquippedItem]: {
    itemId: string;
    equipToAlternateSlot: boolean;
    characterId: string;
  };
  [GameStateUpdateType.CharacterPickedUpItems]: CharacterAndItems;
  [GameStateUpdateType.CharacterSelectedCombatAction]: {
    characterId: string;
    actionAndRankOption: ActionAndRank | null;
    itemIdOption?: string | null;
  };
  [GameStateUpdateType.CharacterCycledTargets]: {
    characterId: string;
    direction: NextOrPrevious;
  };
  [GameStateUpdateType.CharacterCycledTargetingSchemes]: {
    characterId: string;
  };
  [GameStateUpdateType.DungeonFloorNumber]: {
    floorNumber: number;
  };
  [GameStateUpdateType.CharacterSpentAttributePoint]: {
    characterId: string;
    attribute: CombatAttribute;
  };
  [GameStateUpdateType.SavedCharacterList]: {
    characterSlots: Record<CharacterSlotIndex, null | { combatant: Combatant; pets: Combatant[] }>;
  };
  [GameStateUpdateType.SavedCharacter]: {
    character: { combatant: Combatant; pets: Combatant[] };
    slotIndex: number;
  };
  [GameStateUpdateType.SavedCharacterDeleted]: {
    entityId: string;
  };
  [GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame]: {
    username: string;
    character: { combatant: Combatant; pets: Combatant[] };
  };
  [GameStateUpdateType.ProgressionGameStartingFloorSelected]: {
    floorNumber: number;
  };
  [GameStateUpdateType.CharacterSelectedHoldableHotswapSlot]: {
    characterId: string;
    slotIndex: number;
  };
  [GameStateUpdateType.CharacterConvertedItemsToShards]: {
    characterAndItems: CharacterAndItems;
  };
  [GameStateUpdateType.CharacterDroppedShards]: {
    characterId: string;
    shardStack: Consumable;
  };
  [GameStateUpdateType.CharacterPurchasedItem]: {
    characterId: EntityId;
    item: Consumable;
    price: number;
  };
  [GameStateUpdateType.CharacterPerformedCraftingAction]: {
    characterId: EntityId;
    item: Item;
    craftingAction: CraftingAction;
  };
  [GameStateUpdateType.PlayerPostedItemLink]: {
    username: string;
    itemId: EntityId;
  };
  [GameStateUpdateType.CharacterSelectedCombatActionRank]: {
    characterId: EntityId;
    actionRank: number;
  };
  [GameStateUpdateType.CharacterAllocatedAbilityPoint]: {
    characterId: EntityId;
    ability: AbilityTreeAbility;
  };
  [GameStateUpdateType.CharacterTradedItemForBook]: {
    characterId: EntityId;
    itemIdTraded: EntityId;
    book: Consumable;
  };
  [GameStateUpdateType.CharacterRenamedPet]: {
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

export type GameStateUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type GameStateUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: GameStateUpdateHandler<K>;
};

export interface CharacterAndItem {
  characterId: CombatantId;
  itemId: string;
}

export interface CharacterAndItems {
  characterId: CombatantId;
  itemIds: string[];
}

export interface CharacterAndSlot {
  characterId: CombatantId;
  slot: TaggedEquipmentSlot;
}

export class GameListEntry {
  constructor(
    public gameName: GameName,
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

export const GAME_STATE_UPDATE_TYPE_STRINGS: Record<GameStateUpdateType, string> = {
  [GameStateUpdateType.GameList]: "GameList",
  [GameStateUpdateType.OnConnection]: "OnConnection",
  [GameStateUpdateType.CacheGuestSessionReconnectionToken]: "CacheGuestSessionReconnectionToken",
  [GameStateUpdateType.ChannelFullUpdate]: "ChannelFullUpdate",
  [GameStateUpdateType.UserJoinedChannel]: "UserJoinedChannel",
  [GameStateUpdateType.UserLeftChannel]: "UserLeftChannel",
  [GameStateUpdateType.ErrorMessage]: "ErrorMessage",
  [GameStateUpdateType.GameFullUpdate]: "GameFullUpdate",
  [GameStateUpdateType.PartyNameUpdate]: "PartyNameUpdate",
  [GameStateUpdateType.PlayerChangedAdventuringParty]: "PlayerChangedAdventuringParty",
  [GameStateUpdateType.PlayerLeftGame]: "PlayerLeftGame",
  [GameStateUpdateType.PlayerJoinedGame]: "PlayerJoinedGame",
  [GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity]:
    "PlayerDisconnectedWithReconnectionOpportunity",
  [GameStateUpdateType.PlayerReconnectionTimedOut]: "PlayerReconnectionTimedOut",
  [GameStateUpdateType.PartyCreated]: "PartyCreated",
  [GameStateUpdateType.CharacterAddedToParty]: "CharacterAddedToParty",
  [GameStateUpdateType.CharacterDeleted]: "CharacterDeleted",
  [GameStateUpdateType.PlayerToggledReadyToStartGame]: "PlayerToggledReadyToStartGame",
  [GameStateUpdateType.GameStarted]: "GameStarted",
  [GameStateUpdateType.GameServerConnectionInstructions]: "GameServerConnectionInstructions",

  [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]:
    "PlayerToggledReadyToDescendOrExplore",
  [GameStateUpdateType.DungeonRoomTypesOnCurrentFloor]: "DungeonRoomTypesOnCurrentFloor",
  [GameStateUpdateType.DungeonRoomUpdate]: "DungeonRoomUpdate",
  [GameStateUpdateType.BattleFullUpdate]: "BattleFullUpdate",
  [GameStateUpdateType.ActionCommandPayloads]: "ActionCommandPayloads",
  [GameStateUpdateType.GameMessage]: "GameMessage",
  // BattleReport ,
  [GameStateUpdateType.CharacterDroppedItem]: "CharacterDroppedItem",
  [GameStateUpdateType.CharacterDroppedEquippedItem]: "CharacterDroppedEquippedItem",
  [GameStateUpdateType.CharacterUnequippedItem]: "CharacterUnequippedItem",
  [GameStateUpdateType.CharacterEquippedItem]: "CharacterEquippedItem",
  [GameStateUpdateType.CharacterPickedUpItems]: "CharacterPickedUpItems",
  // RawActionResults ,
  [GameStateUpdateType.CharacterSelectedCombatAction]: "CharacterSelectedCombatAction",
  [GameStateUpdateType.CharacterCycledTargets]: "CharacterCycledTargets",
  [GameStateUpdateType.CharacterCycledTargetingSchemes]: "CharacterCycledTargetingSchemes",
  [GameStateUpdateType.DungeonFloorNumber]: "DungeonFloorNumber",
  [GameStateUpdateType.CharacterSpentAttributePoint]: "CharacterSpentAttributePoint",
  [GameStateUpdateType.SavedCharacterList]: "SavedCharacterList",
  [GameStateUpdateType.SavedCharacter]: "SavedCharacter",
  [GameStateUpdateType.SavedCharacterDeleted]: "SavedCharacterDeleted",
  [GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame]:
    "PlayerSelectedSavedCharacterInProgressionGame",
  [GameStateUpdateType.ProgressionGameStartingFloorSelected]:
    "ProgressionGameStartingFloorSelected",
  [GameStateUpdateType.CharacterSelectedHoldableHotswapSlot]:
    "CharacterSelectedHoldableHotswapSlot",
  [GameStateUpdateType.CharacterConvertedItemsToShards]: "CharacterConvertedItemsToShards",
  [GameStateUpdateType.CharacterDroppedShards]: "CharacterDroppedShards",
  [GameStateUpdateType.CharacterPurchasedItem]: "CharacterPurchasedItem",
  [GameStateUpdateType.CharacterPerformedCraftingAction]: "CharacterPerformedCraftingAction",
  [GameStateUpdateType.PlayerPostedItemLink]: "PlayerPostedItemLink",
  // ActionResultReplayTree ,
  [GameStateUpdateType.CharacterSelectedCombatActionRank]: "CharacterSelectedCombatActionRank",
  [GameStateUpdateType.CharacterAllocatedAbilityPoint]: "CharacterAllocatedAbilityPoint",
  [GameStateUpdateType.CharacterTradedItemForBook]: "CharacterTradedItemForBook",
  [GameStateUpdateType.CharacterRenamedPet]: "CharacterRenamedPet",
};
