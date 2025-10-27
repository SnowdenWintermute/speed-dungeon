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
  GameList = "0",
  ClientUsername = "1",
  ChannelFullUpdate = "2",
  UserJoinedChannel = "3",
  UserLeftChannel = "4",
  ErrorMessage = "5",
  GameFullUpdate = "6",
  PartyNameUpdate = "7",
  PlayerChangedAdventuringParty = "8",
  PlayerLeftGame = "9",
  PlayerJoinedGame = "10",
  PartyCreated = "11",
  CharacterAddedToParty = "12",
  CharacterDeleted = "13",
  PlayerToggledReadyToStartGame = "14",
  GameStarted = "15",
  PlayerToggledReadyToDescendOrExplore = "16",
  DungeonRoomTypesOnCurrentFloor = "17",
  DungeonRoomUpdate = "18",
  BattleFullUpdate = "19",
  ActionCommandPayloads = "20",
  GameMessage = "21",
  // BattleReport = "22",
  CharacterDroppedItem = "23",
  CharacterDroppedEquippedItem = "24",
  CharacterUnequippedItem = "25",
  CharacterEquippedItem = "26",
  CharacterPickedUpItems = "27",
  // RawActionResults = "28",
  CharacterSelectedCombatAction = "29",
  CharacterCycledTargets = "30",
  CharacterCycledTargetingSchemes = "31",
  DungeonFloorNumber = "32",
  CharacterSpentAttributePoint = "33",

  SavedCharacterList = "34",
  SavedCharacter = "35",
  SavedCharacterDeleted = "36",
  PlayerSelectedSavedCharacterInProgressionGame = "37",

  ProgressionGameStartingFloorSelected = "38",
  //TEST
  TestItems = "39",
  //
  CharacterSelectedHoldableHotswapSlot = "40",
  CharacterConvertedItemsToShards = "41",
  CharacterDroppedShards = "42",
  CharacterPurchasedItem = "43",
  CharacterPerformedCraftingAction = "44",
  PlayerPostedItemLink = "45",
  // ActionResultReplayTree = "46",
  CharacterSelectedCombatActionLevel = "47",
  CharacterAllocatedAbilityPoint = "48",
  CharacterTradedItemForBook = "49",
}

export interface ServerToClientEventTypes {
  [ServerToClientEvent.GameList]: (gameList: GameListEntry[]) => void;
  [ServerToClientEvent.ChannelFullUpdate]: (
    channelName: string,
    userNames: { username: string; userChannelDisplayData: UserChannelDisplayData }[]
  ) => void;
  [ServerToClientEvent.ClientUsername]: (username: string) => void;
  [ServerToClientEvent.UserJoinedChannel]: (
    username: string,
    userChannelDisplayData: UserChannelDisplayData
  ) => void;
  [ServerToClientEvent.UserLeftChannel]: (username: string) => void;
  [ServerToClientEvent.ErrorMessage]: (message: string) => void;
  [ServerToClientEvent.GameFullUpdate]: (game: null | SpeedDungeonGame) => void;
  [ServerToClientEvent.PartyNameUpdate]: (partyName: null | string) => void;
  [ServerToClientEvent.PlayerChangedAdventuringParty]: (
    playerName: string,
    partyName: null | string
  ) => void;
  [ServerToClientEvent.PlayerLeftGame]: (userame: string) => void;
  [ServerToClientEvent.PlayerJoinedGame]: (userame: string) => void;
  [ServerToClientEvent.PartyCreated]: (partyId: string, partyName: string) => void;
  [ServerToClientEvent.CharacterAddedToParty]: (
    username: string,
    character: Combatant,
    pets: Combatant[]
  ) => void;
  [ServerToClientEvent.CharacterDeleted]: (username: string, characterId: string) => void;
  [ServerToClientEvent.PlayerToggledReadyToStartGame]: (username: string) => void;
  [ServerToClientEvent.GameStarted]: (timeStarted: number) => void;
  [ServerToClientEvent.PlayerToggledReadyToDescendOrExplore]: (
    characterId: string,
    explorationAction: ExplorationAction
  ) => void;
  [ServerToClientEvent.DungeonRoomTypesOnCurrentFloor]: (
    roomTypes: (DungeonRoomType | null)[]
  ) => void;
  [ServerToClientEvent.DungeonRoomUpdate]: (eventData: {
    dungeonRoom: DungeonRoom;
    monsters: Combatant[];
    actionEntitiesToRemove: EntityId[];
  }) => void;
  [ServerToClientEvent.BattleFullUpdate]: (battleOption: null | Battle) => void;
  [ServerToClientEvent.ActionCommandPayloads]: (payloads: ActionCommandPayload[]) => void;
  [ServerToClientEvent.GameMessage]: (message: GameMessage) => void;
  // [ServerToClientEvent.BattleReport]: (report: BattleReport) => void;
  [ServerToClientEvent.CharacterDroppedItem]: (characterAndItem: CharacterAndItem) => void;
  [ServerToClientEvent.CharacterDroppedEquippedItem]: (characterAndItem: CharacterAndSlot) => void;
  [ServerToClientEvent.CharacterUnequippedItem]: (characterAndItem: CharacterAndSlot) => void;
  [ServerToClientEvent.CharacterEquippedItem]: (characterEquip: {
    itemId: string;
    equipToAlternateSlot: boolean;
    characterId: string;
  }) => void;
  [ServerToClientEvent.CharacterPickedUpItems]: (characterAndItems: CharacterAndItems) => void;
  // [ServerToClientEvent.RawActionResults]: (actionResults: ActionResult[]) => void;
  [ServerToClientEvent.CharacterSelectedCombatAction]: (
    characterId: string,
    actionAndRankOption: ActionAndRank | null,
    itemIdOption?: null | string
  ) => void;
  [ServerToClientEvent.CharacterCycledTargets]: (
    characterId: string,
    direction: NextOrPrevious,
    playerUsername: string
  ) => void;
  [ServerToClientEvent.CharacterCycledTargetingSchemes]: (
    characterId: string,
    playerUsername: string
  ) => void;
  [ServerToClientEvent.DungeonFloorNumber]: (number: number) => void;
  [ServerToClientEvent.CharacterSpentAttributePoint]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
  [ServerToClientEvent.SavedCharacterList]: (characterSlots: {
    [slot: number]: null | Combatant;
  }) => void;
  [ServerToClientEvent.SavedCharacter]: (character: Combatant, slot: number) => void;
  [ServerToClientEvent.SavedCharacterDeleted]: (id: string) => void;
  [ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame]: (
    username: string,
    character: Combatant
  ) => void;
  [ServerToClientEvent.ProgressionGameStartingFloorSelected]: (floor: number) => void;
  // was using this to create models of items on client with randomly generated
  // properties since only the server code can currently do that
  [ServerToClientEvent.TestItems]: (items: Item[]) => void;
  [ServerToClientEvent.CharacterSelectedHoldableHotswapSlot]: (
    characterId: string,
    slotIndex: number
  ) => void;
  [ServerToClientEvent.CharacterConvertedItemsToShards]: (
    characterAndItems: CharacterAndItems
  ) => void;
  [ServerToClientEvent.CharacterDroppedShards]: (eventData: {
    characterId: string;
    shardStack: Consumable;
  }) => void;
  [ServerToClientEvent.CharacterPurchasedItem]: (eventData: {
    characterId: EntityId;
    item: Consumable;
    price: number;
  }) => void;
  // @PERF - can save bandwidth by just sending diffs
  [ServerToClientEvent.CharacterPerformedCraftingAction]: (eventData: {
    characterId: EntityId;
    item: Item;
    craftingAction: CraftingAction;
  }) => void;
  [ServerToClientEvent.PlayerPostedItemLink]: (eventData: {
    username: string;
    itemId: EntityId;
  }) => void;
  [ServerToClientEvent.CharacterSelectedCombatActionLevel]: (eventData: {
    characterId: EntityId;
    actionLevel: number;
  }) => void;
  [ServerToClientEvent.CharacterAllocatedAbilityPoint]: (eventData: {
    characterId: EntityId;
    ability: AbilityTreeAbility;
  }) => void;
  [ServerToClientEvent.CharacterTradedItemForBook]: (eventData: {
    characterId: EntityId;
    itemIdTraded: EntityId;
    book: Consumable;
  }) => void;
}

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
