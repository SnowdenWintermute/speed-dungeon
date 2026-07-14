import { Battle, BattleConclusion } from "../battle/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { ShardPayment } from "../game/player-shard-pool.js";
import { Item } from "../items/index.js";
import { NextOrPrevious } from "../primatives/index.js";
import { UserGameHistoryEntry } from "../game-modes/ladder-records/ladder-records-persistence-strategy.js";
import { Combatant } from "../combatants/index.js";
import { GameMessage } from "./game-message.js";
import { UserChannelDisplayData } from "../users/index.js";
import { TaggedEquipmentSlot } from "../items/equipment/slots.js";
import { Consumable } from "../items/consumables/index.js";
import { CraftingAction } from "../items/crafting/crafting-actions.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import { TargetingSelection } from "../combat/targeting/combat-action-targets.js";
import {
  ActionRank,
  ChannelName,
  CombatantId,
  EncryptedOpaqueToken,
  EntityId,
  EntityName,
  GameId,
  GameName,
  ItemId,
  Milliseconds,
  PartyId,
  PartyName,
  Username,
} from "../aliases.js";
import { ExplorationAction } from "../adventuring-party/dungeon-exploration-manager.js";
import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { GameServerConnectionInstructions } from "../servers/lobby-server/game-handoff/connection-instructions.js";
import { SerializedOf } from "../serialization/index.js";
import { Equipment } from "../items/equipment/index.js";
import { SerializedMap } from "../utils/map-utils.js";
import { ClientSequentialEvent } from "./client-sequential-events.js";
import { ClientAppMessageType } from "./client-app-message.js";
import { CharacterControlScheme, GameMode } from "../game-modes/index.js";
import { SerializedCombatantWithPets } from "../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";
import { SavedIronmanRunClientEntry } from "../servers/services/user-game-data-persistence/saved-ironman-runs.js";

export enum GameStateUpdateType {
  GameList,
  OnConnection,
  CacheGuestSessionReconnectionToken,
  ChannelFullUpdate,
  UserJoinedChannel,
  UserLeftChannel,
  ErrorMessage,
  PlayerDisconnectedWithReconnectionOpportunity,
  PlayerReconnectionTimedOut,
  GameFullUpdate,

  // Game Setup
  PlayerChangedAdventuringParty,
  PlayerLeftGame,
  PlayerUsernameUpdated,
  PlayerJoinedGame,
  PartyCreated,
  CharacterAddedToParty,
  CharacterDeleted,
  PlayerToggledReadyToStartGame,
  GameStarted,
  GameServerConnectionInstructions,
  GameClosed,
  PlayerSelectedSavedCharacterInProgressionGame,
  ProgressionGameStartingFloorSelected,
  //
  PlayerToggledReadyToDescendOrExplore,
  DungeonRoomTypesOnCurrentFloor,
  DungeonRoomUpdate,
  BattleFullUpdate,
  ClientSequentialEvents,
  ClientAppMessage,
  GameMessage,
  CharacterDroppedItem,
  CharacterDroppedEquippedItem,
  CharacterUnequippedItem,
  CharacterEquippedItem,
  CharacterPickedUpItems,
  // RawActionResults ,
  CharacterSelectedCombatAction,
  CharacterCycledTargets,
  CharacterSetCombatActionTarget,
  CharacterCycledTargetingSchemes,
  DungeonFloorNumber,
  CharacterSpentAttributePoint,
  // Persistence
  SavedCharacterList,
  IronmanRunsList,
  IronmanRunAbandoned,
  SavedCharacter,
  // ladder game records
  UserGameHistoryPage,
  UserGameRecordsCount,
  SavedCharacterDeleted,
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
  EndOfUpdateStream,
}

export interface GameStateUpdateMap {
  [GameStateUpdateType.GameList]: {
    gameList: GameListEntry[];
  };
  [GameStateUpdateType.OnConnection]: {
    username: Username;
    willBeReconnectedToGame?: boolean;
  };
  [GameStateUpdateType.CacheGuestSessionReconnectionToken]: {
    token: EncryptedOpaqueToken;
  };
  [GameStateUpdateType.ChannelFullUpdate]: {
    channelName: ChannelName;
    users: SerializedMap<Map<Username, UserChannelDisplayData>>;
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
    clientIntentSequenceId: number;
  };
  [GameStateUpdateType.GameFullUpdate]: {
    game: SerializedOf<SpeedDungeonGame> | null;
    // for players reconnecting, they already see the resolved state of combat actions but
    // input should still be locked until the replay plays out on other clients
    // since server side party will still be input locked
    awaitingUnresolvedReplayResolutionDuration?: Milliseconds;
    battle?: {
      battle: SerializedOf<Battle>;
      combatantActionPoints: { combatantId: CombatantId; actionPoints: number }[];
    };
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
  [GameStateUpdateType.PlayerUsernameUpdated]: {
    oldUsername: Username;
    newUsername: Username;
  };
  [GameStateUpdateType.PlayerJoinedGame]: {
    username: Username;
    joinOrder: number;
  };
  [GameStateUpdateType.PartyCreated]: {
    partyId: PartyId;
    partyName: PartyName;
  };
  [GameStateUpdateType.CharacterAddedToParty]: {
    username: Username;
    character: SerializedOf<Combatant>;
    pets: SerializedOf<Combatant>[];
  };
  [GameStateUpdateType.CharacterDeleted]: {
    username: Username;
    characterId: CombatantId;
  };
  [GameStateUpdateType.PlayerToggledReadyToStartGame]: {
    username: Username;
  };
  [GameStateUpdateType.GameStarted]: {
    firstStartedAt: number;
  };
  [GameStateUpdateType.GameServerConnectionInstructions]: {
    connectionInstructions: GameServerConnectionInstructions;
  };
  [GameStateUpdateType.GameClosed]: {
    reason: GameClosedReason;
  };
  [GameStateUpdateType.ClientAppMessage]: ClientAppMessageType;
  [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]: {
    username: Username;
    explorationAction: ExplorationAction;
  };
  [GameStateUpdateType.DungeonRoomTypesOnCurrentFloor]: {
    roomTypes: (DungeonRoomType | null)[];
  };
  [GameStateUpdateType.DungeonRoomUpdate]: {
    dungeonRoom: DungeonRoom;
    monsters: SerializedOf<Combatant>[];
    actionEntitiesToRemove: EntityId[];
  };
  [GameStateUpdateType.BattleFullUpdate]: {
    battle: SerializedOf<Battle>;
    combatantActionPoints: { combatantId: CombatantId; actionPoints: number }[];
  } | null;

  [GameStateUpdateType.ClientSequentialEvents]: {
    sequentialEvents: ClientSequentialEvent[];
  };
  [GameStateUpdateType.GameMessage]: {
    message: GameMessage;
  };
  [GameStateUpdateType.CharacterDroppedItem]: CharacterAndItem;
  [GameStateUpdateType.CharacterDroppedEquippedItem]: CharacterAndSlot;
  [GameStateUpdateType.CharacterUnequippedItem]: CharacterAndSlot;
  [GameStateUpdateType.CharacterEquippedItem]: {
    itemId: ItemId;
    equipToAlternateSlot: boolean;
    characterId: CombatantId;
  };
  [GameStateUpdateType.CharacterPickedUpItems]: CharacterAndItems;
  [GameStateUpdateType.CharacterSelectedCombatAction]: {
    characterId: CombatantId;
    actionAndRankOption: SerializedOf<ActionAndRank> | null;
    itemIdOption?: string | null;
    targetingSelectionOption?: TargetingSelection;
    autoSelected?: boolean;
  };
  [GameStateUpdateType.CharacterCycledTargets]: {
    characterId: CombatantId;
    direction: NextOrPrevious;
  };
  [GameStateUpdateType.CharacterSetCombatActionTarget]: {
    characterId: CombatantId;
    targetingSelection: TargetingSelection;
  };
  [GameStateUpdateType.CharacterCycledTargetingSchemes]: {
    characterId: CombatantId;
  };
  [GameStateUpdateType.DungeonFloorNumber]: {
    floorNumber: number;
  };
  [GameStateUpdateType.CharacterSpentAttributePoint]: {
    characterId: CombatantId;
    attribute: CombatAttribute;
  };
  [GameStateUpdateType.SavedCharacterList]: {
    characterControlScheme: CharacterControlScheme;
    characters: SerializedCombatantWithPets[];
    capacity: number;
  };
  [GameStateUpdateType.IronmanRunsList]: {
    savedIronmanRuns: SerializedOf<SavedIronmanRunClientEntry>[];
    ironmanRunCapacity: number;
  };
  [GameStateUpdateType.UserGameHistoryPage]: {
    page: number;
    entries: UserGameHistoryEntry[];
  };
  [GameStateUpdateType.UserGameRecordsCount]: {
    count: number;
  };
  [GameStateUpdateType.IronmanRunAbandoned]: {
    usernameAbandoning: Username;
    runId: GameId;
  };
  [GameStateUpdateType.SavedCharacter]: {
    characterControlScheme: CharacterControlScheme;
    character: SerializedCombatantWithPets;
  };
  [GameStateUpdateType.SavedCharacterDeleted]: {
    entityId: CombatantId;
  };
  [GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame]: {
    username: Username;
    character: { combatant: SerializedOf<Combatant>; pets: SerializedOf<Combatant>[] };
  };
  [GameStateUpdateType.ProgressionGameStartingFloorSelected]: {
    floorNumber: number;
  };
  [GameStateUpdateType.CharacterSelectedHoldableHotswapSlot]: {
    characterId: CombatantId;
    slotIndex: number;
  };
  [GameStateUpdateType.CharacterConvertedItemsToShards]: CharacterAndItems;
  [GameStateUpdateType.CharacterDroppedShards]: {
    characterId: CombatantId;
    shardStack: SerializedOf<Consumable>;
  };
  [GameStateUpdateType.CharacterPurchasedItem]: {
    characterId: CombatantId;
    item: SerializedOf<Consumable>;
    payments: ShardPayment[];
  };
  [GameStateUpdateType.CharacterPerformedCraftingAction]: {
    characterId: CombatantId;
    item: SerializedOf<Equipment>;
    craftingAction: CraftingAction;
    payments: ShardPayment[];
  };
  [GameStateUpdateType.PlayerPostedItemLink]: {
    username: Username;
    itemId: EntityId;
  };
  [GameStateUpdateType.CharacterSelectedCombatActionRank]: {
    characterId: CombatantId;
    actionRank: ActionRank;
  };
  [GameStateUpdateType.CharacterAllocatedAbilityPoint]: {
    characterId: CombatantId;
    ability: AbilityTreeAbility;
  };
  [GameStateUpdateType.CharacterTradedItemForBook]: {
    characterId: CombatantId;
    itemIdTraded: EntityId;
    book: SerializedOf<Consumable>;
  };
  [GameStateUpdateType.CharacterRenamedPet]: {
    petId: CombatantId;
    newName: EntityName;
  };
  [GameStateUpdateType.EndOfUpdateStream]: {
    clientIntentSequenceId: number;
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
    public gameId: GameId,
    public numberOfUsers: number,
    public gameMode: GameMode,
    public handedOffAt: null | number,
    public isRanked: boolean
  ) {}
}

export enum GameClosedReason {
  PlayerLeftGame,
}

export const GAME_CLOSED_REASON_STRINGS: Record<GameClosedReason, string> = {
  [GameClosedReason.PlayerLeftGame]: "Player left game",
};

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
  [GameStateUpdateType.PlayerChangedAdventuringParty]: "PlayerChangedAdventuringParty",
  [GameStateUpdateType.PlayerLeftGame]: "PlayerLeftGame",
  [GameStateUpdateType.PlayerUsernameUpdated]: "PlayerUsernameUpdated",
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
  [GameStateUpdateType.GameClosed]: "GameClosed",
  [GameStateUpdateType.ClientAppMessage]: "ClientAppMessage",

  [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]:
    "PlayerToggledReadyToDescendOrExplore",
  [GameStateUpdateType.DungeonRoomTypesOnCurrentFloor]: "DungeonRoomTypesOnCurrentFloor",
  [GameStateUpdateType.DungeonRoomUpdate]: "DungeonRoomUpdate",
  [GameStateUpdateType.BattleFullUpdate]: "BattleFullUpdate",
  [GameStateUpdateType.ClientSequentialEvents]: "ClientSequentialEvents",
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
  [GameStateUpdateType.CharacterSetCombatActionTarget]: "CharacterSetCombatActionTarget",
  [GameStateUpdateType.CharacterCycledTargetingSchemes]: "CharacterCycledTargetingSchemes",
  [GameStateUpdateType.DungeonFloorNumber]: "DungeonFloorNumber",
  [GameStateUpdateType.CharacterSpentAttributePoint]: "CharacterSpentAttributePoint",
  [GameStateUpdateType.SavedCharacterList]: "SavedCharacterList",
  [GameStateUpdateType.IronmanRunsList]: "IronmanRunsList",
  [GameStateUpdateType.UserGameHistoryPage]: "UserGameHistoryPage",
  [GameStateUpdateType.UserGameRecordsCount]: "UserGameRecordsCount",
  [GameStateUpdateType.IronmanRunAbandoned]: "IronmanRunAbandoned",
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
  [GameStateUpdateType.EndOfUpdateStream]: "EndOfUpdateStream",
};
