import { CombatAction } from "../combat/index.js";
import { CombatAttribute, CombatantClass } from "../combatants/index.js";
import { EquipmentSlot } from "../items/index.js";
import { NextOrPrevious } from "../primatives/index.js";
import { CharacterAndItem, EquipItemPacket } from "./server-to-client.js";

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
}

export interface ClientToServerEventTypes {
  [ClientToServerEvent.RequestToJoinGame]: (gameName: string) => void;
  [ClientToServerEvent.RequestsGameList]: () => void;
  [ClientToServerEvent.CreateGame]: (gameName: string) => void;
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
  [ClientToServerEvent.ToggleReadyToExplore]: () => void;
  [ClientToServerEvent.UnequipSlot]: (characterId: string, slot: EquipmentSlot) => void;
  [ClientToServerEvent.EquipInventoryItem]: (equipItemPacket: EquipItemPacket) => void;
  [ClientToServerEvent.CycleCombatActionTargets]: (
    characterId: string,
    direction: NextOrPrevious
  ) => void;
  [ClientToServerEvent.CycleTargetingSchemes]: (characterId: string) => void;
  [ClientToServerEvent.UseSelectedCombatAction]: (characterId: string) => void;
  [ClientToServerEvent.DropEquippedItem]: (characterId: string, slot: EquipmentSlot) => void;
  [ClientToServerEvent.DropItem]: (characterId: string, itemId: string) => void;
  [ClientToServerEvent.ToggleReadyToDescend]: () => void;
  [ClientToServerEvent.AssignAttributePoint]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
  [ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate]: (itemId: string) => void;
  [ClientToServerEvent.PickUpItem]: (characterAndItem: CharacterAndItem) => void;
}
