import { Battle } from "../battle/index.js";
import { ActionCommandPayload } from "../action-processing/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Item } from "../items/index.js";
import { NextOrPrevious } from "../primatives/index.js";
import { Combatant } from "../combatants/index.js";
import { GameMessage } from "./game-message.js";
import { UserChannelDisplayData } from "../users/index.js";
import { Consumable } from "../items/consumables/index.js";
import { CraftingAction } from "../items/crafting/crafting-actions.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import {
  CharacterAndItem,
  CharacterAndItems,
  CharacterAndSlot,
  GameListEntry,
  GameStateUpdate,
} from "./game-state-updates.js";
import { ActionRank, ChannelName, EntityId, EntityName, PartyName, Username } from "../aliases.js";
import { ExplorationAction } from "../adventuring-party/dungeon-exploration-manager.js";
import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";

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
  CharacterRenamedPet = "50",
  GameStateUpdate = "51",
  MessageToGameServer = "52",
}

export interface ServerToClientEventTypes {
  [ServerToClientEvent.GameList]: (gameList: GameListEntry[]) => void;
  [ServerToClientEvent.ChannelFullUpdate]: (
    channelName: ChannelName,
    userNames: Map<Username, UserChannelDisplayData>
  ) => void;
  [ServerToClientEvent.ClientUsername]: (username: Username) => void;
  [ServerToClientEvent.UserJoinedChannel]: (
    username: Username,
    userChannelDisplayData: UserChannelDisplayData
  ) => void;
  [ServerToClientEvent.UserLeftChannel]: (username: Username) => void;
  [ServerToClientEvent.ErrorMessage]: (message: string) => void;
  [ServerToClientEvent.GameFullUpdate]: (game: null | SpeedDungeonGame) => void;
  [ServerToClientEvent.PartyNameUpdate]: (partyName: null | PartyName) => void;
  [ServerToClientEvent.PlayerChangedAdventuringParty]: (
    playerName: Username,
    partyName: null | PartyName
  ) => void;
  [ServerToClientEvent.PlayerLeftGame]: (username: Username) => void;
  [ServerToClientEvent.PlayerJoinedGame]: (username: Username) => void;
  [ServerToClientEvent.PartyCreated]: (partyId: string, partyName: PartyName) => void;
  [ServerToClientEvent.CharacterAddedToParty]: (
    username: Username,
    character: Combatant,
    pets: Combatant[]
  ) => void;
  [ServerToClientEvent.CharacterDeleted]: (username: Username, characterId: EntityId) => void;
  [ServerToClientEvent.PlayerToggledReadyToStartGame]: (username: Username) => void;
  [ServerToClientEvent.GameStarted]: (timeStarted: number) => void;
  [ServerToClientEvent.PlayerToggledReadyToDescendOrExplore]: (
    characterId: EntityId,
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
    itemId: EntityId;
    equipToAlternateSlot: boolean;
    characterId: string;
  }) => void;
  [ServerToClientEvent.CharacterPickedUpItems]: (characterAndItems: CharacterAndItems) => void;
  // [ServerToClientEvent.RawActionResults]: (actionResults: ActionResult[]) => void;
  [ServerToClientEvent.CharacterSelectedCombatAction]: (
    characterId: EntityId,
    actionAndRankOption: ActionAndRank | null,
    itemIdOption?: null | string
  ) => void;
  [ServerToClientEvent.CharacterCycledTargets]: (
    characterId: EntityId,
    direction: NextOrPrevious,
    playerUsername: Username
  ) => void;
  [ServerToClientEvent.CharacterCycledTargetingSchemes]: (
    characterId: EntityId,
    playerUsername: Username
  ) => void;
  [ServerToClientEvent.DungeonFloorNumber]: (number: number) => void;
  [ServerToClientEvent.CharacterSpentAttributePoint]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
  [ServerToClientEvent.SavedCharacterList]: (characterSlots: {
    [slot: number]: null | { combatant: Combatant; pets: Combatant[] };
  }) => void;
  [ServerToClientEvent.SavedCharacter]: (
    character: { combatant: Combatant; pets: Combatant[] },
    slot: number
  ) => void;
  [ServerToClientEvent.SavedCharacterDeleted]: (id: string) => void;
  [ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame]: (
    username: Username,
    character: { combatant: Combatant; pets: Combatant[] }
  ) => void;
  [ServerToClientEvent.ProgressionGameStartingFloorSelected]: (floor: number) => void;
  // was using this to create models of items on client with randomly generated
  // properties since only the server code can currently do that
  [ServerToClientEvent.TestItems]: (items: Item[]) => void;
  [ServerToClientEvent.CharacterSelectedHoldableHotswapSlot]: (
    characterId: EntityId,
    slotIndex: number
  ) => void;
  [ServerToClientEvent.CharacterConvertedItemsToShards]: (
    characterAndItems: CharacterAndItems
  ) => void;
  [ServerToClientEvent.CharacterDroppedShards]: (eventData: {
    characterId: EntityId;
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
    username: Username;
    itemId: EntityId;
  }) => void;
  [ServerToClientEvent.CharacterSelectedCombatActionLevel]: (eventData: {
    characterId: EntityId;
    actionLevel: ActionRank;
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
  [ServerToClientEvent.CharacterRenamedPet]: (eventData: {
    petId: EntityId;
    newName: EntityName;
  }) => void;
  [ServerToClientEvent.GameStateUpdate]: (eventData: GameStateUpdate) => void;
  [ServerToClientEvent.MessageToGameServer]: (eventData: string) => void;
}
