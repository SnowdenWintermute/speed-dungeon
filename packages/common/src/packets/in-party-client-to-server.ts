import { CombatAction } from "../combat";
import { CombatAttribute } from "../combatants";
import { EquipmentSlot } from "../items";

export enum InPartyClientToServerEvent {
  SelectCombatAction = "0",
  IncrementAttribute = "1",
  ToggleReadyToExplore = "2",
  UnequipSlot = "3",
  EquipInventoryItem = "4",
}

export interface InPartyClientToServerEventTypes {
  [InPartyClientToServerEvent.SelectCombatAction]: (
    characterId: string,
    combatActionOption: null | CombatAction
  ) => void;
  [InPartyClientToServerEvent.IncrementAttribute]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
  [InPartyClientToServerEvent.ToggleReadyToExplore]: () => void;
  [InPartyClientToServerEvent.UnequipSlot]: (characterId: string, slot: EquipmentSlot) => void;
  [InPartyClientToServerEvent.EquipInventoryItem]: (
    characterId: string,
    itemId: string,
    altSlot: boolean
  ) => void;
}
