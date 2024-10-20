import { CombatAction } from "../combat/index.js";
import { CombatAttribute, CombatantClass } from "../combatants/index.js";
import { EquipmentSlot } from "../items/index.js";
import { NextOrPrevious } from "../primatives/index.js";
import { CharacterAssociatedData, GameMode, PlayerAssociatedData } from "../types.js";
import { CharacterAndItem } from "./server-to-client.js";

export enum ClientToServerEvent {
  RequestToJoinGame = "0",
  RequestsGameList = "1",
  CreateGame = "2",
  JoinGame = "3",
  LeaveGame = "4",
  CreateParty = "5",
  JoinParty = "6",
  LeaveParty = "7",
  ToggleReadyToStartGame = "8",
  CreateCharacter = "9",
  DeleteCharacter = "10",
  SelectCombatAction = "11",
  IncrementAttribute = "12",
  ToggleReadyToExplore = "13",
  UnequipSlot = "14",
  EquipInventoryItem = "15",
  CycleCombatActionTargets = "16",
  CycleTargetingSchemes = "17",
  UseSelectedCombatAction = "18",
  DropEquippedItem = "19",
  DropItem = "20",
  ToggleReadyToDescend = "21",
  AssignAttributePoint = "22",
  AcknowledgeReceiptOfItemOnGroundUpdate = "23",
  PickUpItem = "24",
  GetSavedCharactersList = "25",
  GetSavedCharacterById = "26",
  CreateSavedCharacter = "27",
  DeleteSavedCharacter = "28",
  SelectSavedCharacterForProgressGame = "29",
  SelectProgressionGameStartingFloor = "30",
}

export interface ClientToServerEventTypes {
  [ClientToServerEvent.RequestToJoinGame]: (gameName: string) => void;
  [ClientToServerEvent.RequestsGameList]: () => void;
  [ClientToServerEvent.CreateGame]: (gameName: string, gameMode: GameMode) => void;
  [ClientToServerEvent.JoinGame]: (gameName: string) => void;
  [ClientToServerEvent.LeaveGame]: () => void;
  [ClientToServerEvent.CreateParty]: (partyName: string) => void;
  [ClientToServerEvent.JoinParty]: (partyName: string) => void;
  [ClientToServerEvent.LeaveParty]: () => void;
  [ClientToServerEvent.ToggleReadyToStartGame]: () => void;
  [ClientToServerEvent.CreateCharacter]: (
    characterName: string,
    combatantClass: CombatantClass
  ) => void;
  [ClientToServerEvent.DeleteCharacter]: (characterId: string) => void;
  [ClientToServerEvent.SelectCombatAction]: (
    characterId: string,
    combatActionOption: null | CombatAction
  ) => void;
  [ClientToServerEvent.IncrementAttribute]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
  [ClientToServerEvent.ToggleReadyToExplore]: (
    eventData?: undefined,
    data?: PlayerAssociatedData
  ) => void;
  [ClientToServerEvent.UnequipSlot]: (
    eventData: { characterId: string; slot: EquipmentSlot },
    middlewareProvidedData?: CharacterAssociatedData
  ) => void;
  [ClientToServerEvent.EquipInventoryItem]: (
    eventData: { characterId: string; itemId: string; equipToAltSlot: boolean },
    middlewareProvidedData?: CharacterAssociatedData
  ) => void;
  [ClientToServerEvent.CycleCombatActionTargets]: (
    characterId: string,
    direction: NextOrPrevious
  ) => void;
  [ClientToServerEvent.CycleTargetingSchemes]: (characterId: string) => void;
  [ClientToServerEvent.UseSelectedCombatAction]: (characterId: string) => void;
  [ClientToServerEvent.DropEquippedItem]: (
    eventData: { characterId: string; slot: EquipmentSlot },
    middlewareProvidedData?: CharacterAssociatedData
  ) => void;
  [ClientToServerEvent.DropItem]: (
    eventData: { characterId: string; itemId: string },
    middlewareProvidedData?: CharacterAssociatedData
  ) => void;
  [ClientToServerEvent.ToggleReadyToDescend]: (
    eventData?: undefined,
    data?: PlayerAssociatedData
  ) => void;
  [ClientToServerEvent.AssignAttributePoint]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
  [ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate]: (itemId: string) => void;
  [ClientToServerEvent.PickUpItem]: (characterAndItem: CharacterAndItem) => void;
  [ClientToServerEvent.GetSavedCharactersList]: () => void;
  [ClientToServerEvent.GetSavedCharacterById]: (entityId: string) => void;
  [ClientToServerEvent.CreateSavedCharacter]: (
    name: string,
    combatantClass: CombatantClass,
    slot: number
  ) => void;
  [ClientToServerEvent.DeleteSavedCharacter]: (entityId: string) => void;
  [ClientToServerEvent.SelectSavedCharacterForProgressGame]: (entityId: string) => void;
  [ClientToServerEvent.SelectProgressionGameStartingFloor]: (floor: number) => void;
}
