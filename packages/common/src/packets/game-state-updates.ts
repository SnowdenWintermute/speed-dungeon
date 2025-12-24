import { DungeonRoom, DungeonRoomType, ExplorationAction } from "../adventuring-party/index.js";
import { Battle, BattleConclusion } from "../battle/index.js";
import { ActionCommandPayload } from "../action-processing/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Item } from "../items/index.js";
import { EntityId, NextOrPrevious } from "../primatives/index.js";
import { Combatant } from "../combatants/index.js";
import { GameMessage } from "./game-message.js";
import { UserChannelDisplayData } from "../users/index.js";
import { GameMode, Username } from "../types.js";
import { TaggedEquipmentSlot } from "../items/equipment/slots.js";
import { Consumable } from "../items/consumables/index.js";
import { CraftingAction } from "../items/crafting/crafting-actions.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";

export enum GameStateUpdateType {
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
  [GameStateUpdateType.GameList]: {
    gameList: GameListEntry[];
  };
  [GameStateUpdateType.ClientUsername]: {
    username: string;
  };
  [GameStateUpdateType.ChannelFullUpdate]: {
    channelName: string;
    users: Map<Username, UserChannelDisplayData>;
  };
  [GameStateUpdateType.UserJoinedChannel]: {
    username: string;
    userChannelDisplayData: UserChannelDisplayData;
  };
  [GameStateUpdateType.UserLeftChannel]: {
    username: string;
  };
  [GameStateUpdateType.ErrorMessage]: {
    message: string;
  };
  [GameStateUpdateType.GameFullUpdate]: {
    game: SpeedDungeonGame | null;
  };
  [GameStateUpdateType.PartyNameUpdate]: {
    partyName: string | null;
  };
  [GameStateUpdateType.PlayerChangedAdventuringParty]: {
    playerName: string;
    partyName: string | null;
  };
  [GameStateUpdateType.PlayerLeftGame]: {
    username: string;
  };
  [GameStateUpdateType.PlayerJoinedGame]: {
    username: string;
  };
  [GameStateUpdateType.PartyCreated]: {
    partyId: string;
    partyName: string;
  };
  [GameStateUpdateType.CharacterAddedToParty]: {
    username: string;
    character: Combatant;
    pets: Combatant[];
  };
  [GameStateUpdateType.CharacterDeleted]: {
    username: string;
    characterId: string;
  };
  [GameStateUpdateType.PlayerToggledReadyToStartGame]: {
    username: string;
  };
  [GameStateUpdateType.GameStarted]: {
    timeStarted: number;
  };
  [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]: {
    characterId: string;
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
  [GameStateUpdateType.CharacterDroppedItem]: {
    characterAndItem: CharacterAndItem;
  };
  [GameStateUpdateType.CharacterDroppedEquippedItem]: {
    characterAndItem: CharacterAndSlot;
  };
  [GameStateUpdateType.CharacterUnequippedItem]: {
    characterAndItem: CharacterAndSlot;
  };
  [GameStateUpdateType.CharacterEquippedItem]: {
    itemId: string;
    equipToAlternateSlot: boolean;
    characterId: string;
  };
  [GameStateUpdateType.CharacterPickedUpItems]: {
    characterAndItems: CharacterAndItems;
  };
  [GameStateUpdateType.CharacterSelectedCombatAction]: {
    characterId: string;
    actionAndRankOption: ActionAndRank | null;
    itemIdOption?: string | null;
  };
  [GameStateUpdateType.CharacterCycledTargets]: {
    characterId: string;
    direction: NextOrPrevious;
    playerUsername: string;
  };
  [GameStateUpdateType.CharacterCycledTargetingSchemes]: {
    characterId: string;
    playerUsername: string;
  };
  [GameStateUpdateType.DungeonFloorNumber]: {
    floor: number;
  };
  [GameStateUpdateType.CharacterSpentAttributePoint]: {
    characterId: string;
    attribute: CombatAttribute;
  };
  [GameStateUpdateType.SavedCharacterList]: {
    characterSlots: {
      [slot: number]: null | { combatant: Combatant; pets: Combatant[] };
    };
  };
  [GameStateUpdateType.SavedCharacter]: {
    character: { combatant: Combatant; pets: Combatant[] };
    slotIndex: number;
  };
  [GameStateUpdateType.SavedCharacterDeleted]: {
    id: string;
  };
  [GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame]: {
    username: string;
    character: { combatant: Combatant; pets: Combatant[] };
  };
  [GameStateUpdateType.ProgressionGameStartingFloorSelected]: {
    floor: number;
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
  [GameStateUpdateType.CharacterSelectedCombatActionLevel]: {
    characterId: EntityId;
    actionLevel: number;
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
