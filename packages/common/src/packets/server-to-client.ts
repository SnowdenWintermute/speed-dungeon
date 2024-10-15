import { DungeonRoom, DungeonRoomType } from "../adventuring-party/index.js";
import { Battle, BattleConclusion } from "../battle/index.js";
import { CombatAction } from "../combat/index.js";
import { ActionCommandPayload } from "../action-processing/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { EquipmentSlot, Item } from "../items/index.js";
import { NextOrPrevious } from "../primatives/index.js";
import { CombatAttribute, Combatant } from "../combatants/index.js";
import { GameMessage } from "./game-message.js";
import { DescendOrExplore } from "../adventuring-party/update-player-readiness.js";
import { UserChannelDisplayData } from "../users/index.js";

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
  CharacterCreated = "12",
  CharacterDeleted = "13",
  PlayerToggledReadyToStartGame = "14",
  GameStarted = "15",
  PlayerToggledReadyToDescendOrExplore = "16",
  DungeonRoomTypesOnCurrentFloor = "17",
  DungeonRoomUpdate = "18",
  BattleFullUpdate = "19",
  ActionCommandPayloads = "20",
  GameMessage = "21",
  BattleReport = "22",
  CharacterDroppedItem = "23",
  CharacterDroppedEquippedItem = "24",
  CharacterUnequippedItem = "25",
  CharacterEquippedItem = "26",
  CharacterPickedUpItem = "27",
  // RawActionResults = "28",
  CharacterSelectedCombatAction = "29",
  CharacterCycledTargets = "30",
  CharacterCycledTargetingSchemes = "31",
  DungeonFloorNumber = "32",
  CharacterSpentAttributePoint = "33",
  SavedCharacterList = "34",
  SavedCharacter = "35",
  SavedCharacterDeleted = "36",
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
  [ServerToClientEvent.PartyCreated]: (partyName: string) => void;
  [ServerToClientEvent.CharacterCreated]: (
    partyName: string,
    username: string,
    character: Combatant
  ) => void;
  [ServerToClientEvent.CharacterDeleted]: (
    partyName: string,
    username: string,
    characterId: string
  ) => void;
  [ServerToClientEvent.PlayerToggledReadyToStartGame]: (username: string) => void;
  [ServerToClientEvent.GameStarted]: (timeStarted: number) => void;
  [ServerToClientEvent.PlayerToggledReadyToDescendOrExplore]: (
    characterId: string,
    descendOrExplore: DescendOrExplore
  ) => void;
  [ServerToClientEvent.DungeonRoomTypesOnCurrentFloor]: (
    roomTypes: (DungeonRoomType | null)[]
  ) => void;
  [ServerToClientEvent.DungeonRoomUpdate]: (dungeonRoom: DungeonRoom) => void;
  [ServerToClientEvent.BattleFullUpdate]: (battleOption: null | Battle) => void;
  [ServerToClientEvent.ActionCommandPayloads]: (
    entityId: string,
    payloads: ActionCommandPayload[]
  ) => void;
  [ServerToClientEvent.GameMessage]: (message: GameMessage) => void;
  [ServerToClientEvent.BattleReport]: (report: BattleReport) => void;
  [ServerToClientEvent.CharacterDroppedItem]: (characterAndItem: CharacterAndItem) => void;
  [ServerToClientEvent.CharacterDroppedEquippedItem]: (characterAndItem: CharacterAndSlot) => void;
  [ServerToClientEvent.CharacterUnequippedItem]: (characterAndItem: CharacterAndSlot) => void;
  [ServerToClientEvent.CharacterEquippedItem]: (characterAndItem: EquipItemPacket) => void;
  [ServerToClientEvent.CharacterPickedUpItem]: (characterAndItem: CharacterAndItem) => void;
  // [ServerToClientEvent.RawActionResults]: (actionResults: ActionResult[]) => void;
  [ServerToClientEvent.CharacterSelectedCombatAction]: (
    characterId: string,
    combatActionOption: null | CombatAction
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
}

export interface EquipItemPacket {
  characterId: string;
  itemId: string;
  equipToAlternateSlot: boolean;
}

export interface CharacterAndItem {
  characterId: string;
  itemId: string;
}

export interface CharacterAndSlot {
  characterId: string;
  slot: EquipmentSlot;
}

export class GameListEntry {
  constructor(
    public gameName: string,
    public numberOfUsers: number,
    public timeStarted: null | number
  ) {}
}

export class BattleReport {
  constructor(
    public conclusion: BattleConclusion,
    public loot: Item[] = [],
    public expChanges: { combatantId: string; experienceChange: number }[] = []
  ) {}
}
