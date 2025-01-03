import { CombatAttribute } from "../attributes/index.js";
import { CombatAction } from "../combat/index.js";
import { CombatantClass } from "../combatants/index.js";
import { TaggedEquipmentSlot } from "../items/equipment/slots.js";
import { NextOrPrevious } from "../primatives/index.js";
import { GameMode } from "../types.js";
import { CharacterAndItems } from "./server-to-client.js";

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
  // AssignAttributePoint = "22", replaced by IncrementAttribute
  AcknowledgeReceiptOfItemOnGroundUpdate = "23",
  PickUpItems = "24",
  GetSavedCharactersList = "25",
  GetSavedCharacterById = "26",
  CreateSavedCharacter = "27",
  DeleteSavedCharacter = "28",
  SelectSavedCharacterForProgressGame = "29",
  SelectProgressionGameStartingFloor = "30",
  SelectHoldableHotswapSlot = "31",
}

export interface ClientToServerEventTypes {
  [ClientToServerEvent.RequestToJoinGame]: (gameName: string) => void;
  [ClientToServerEvent.RequestsGameList]: () => void;
  [ClientToServerEvent.CreateGame]: (eventData: {
    gameName: string;
    mode: GameMode;
    isRanked?: boolean;
  }) => void;
  [ClientToServerEvent.JoinGame]: (gameName: string) => void;
  [ClientToServerEvent.LeaveGame]: (eventData?: undefined) => void;
  [ClientToServerEvent.CreateParty]: (partyName: string) => void;
  [ClientToServerEvent.JoinParty]: (partyName: string) => void;
  [ClientToServerEvent.LeaveParty]: (eventData?: undefined) => void;
  [ClientToServerEvent.ToggleReadyToStartGame]: (eventData?: undefined) => void;
  [ClientToServerEvent.CreateCharacter]: (eventData: {
    name: string;
    combatantClass: CombatantClass;
  }) => void;
  [ClientToServerEvent.DeleteCharacter]: (characterId: string) => void;
  [ClientToServerEvent.SelectCombatAction]: (eventData: {
    characterId: string;
    combatActionOption: null | CombatAction;
  }) => void;
  [ClientToServerEvent.IncrementAttribute]: (eventData: {
    characterId: string;
    attribute: CombatAttribute;
  }) => void;
  [ClientToServerEvent.ToggleReadyToExplore]: (eventData?: undefined) => void;
  [ClientToServerEvent.UnequipSlot]: (eventData: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  }) => void;
  [ClientToServerEvent.EquipInventoryItem]: (eventData: {
    characterId: string;
    itemId: string;
    equipToAltSlot: boolean;
  }) => void;
  [ClientToServerEvent.CycleCombatActionTargets]: (eventData: {
    characterId: string;
    direction: NextOrPrevious;
  }) => void;
  [ClientToServerEvent.CycleTargetingSchemes]: (eventData: { characterId: string }) => void;
  [ClientToServerEvent.UseSelectedCombatAction]: (eventData: { characterId: string }) => void;
  [ClientToServerEvent.DropEquippedItem]: (eventData: {
    characterId: string;
    slot: TaggedEquipmentSlot;
  }) => void;
  [ClientToServerEvent.DropItem]: (eventData: { characterId: string; itemId: string }) => void;
  [ClientToServerEvent.ToggleReadyToDescend]: (eventData?: undefined) => void;
  [ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate]: (itemId: string) => void;
  [ClientToServerEvent.PickUpItems]: (characterAndItem: CharacterAndItems) => void;
  [ClientToServerEvent.GetSavedCharactersList]: (eventData?: undefined) => void;
  [ClientToServerEvent.GetSavedCharacterById]: (entityId: string) => void;
  [ClientToServerEvent.CreateSavedCharacter]: (eventData: {
    name: string;
    combatantClass: CombatantClass;
    slotNumber: number;
  }) => void;
  [ClientToServerEvent.DeleteSavedCharacter]: (entityId: string) => void;
  [ClientToServerEvent.SelectSavedCharacterForProgressGame]: (entityId: string) => void;
  [ClientToServerEvent.SelectProgressionGameStartingFloor]: (floor: number) => void;
  [ClientToServerEvent.SelectHoldableHotswapSlot]: (eventData: {
    characterId: string;
    slotIndex: number;
  }) => void;
}
