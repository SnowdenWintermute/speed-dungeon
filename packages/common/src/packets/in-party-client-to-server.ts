import { CombatAction } from "../combat";
import { CombatAttribute } from "../combatants";
import { EquipmentSlot } from "../items";
import { NextOrPrevious } from "../primatives";

export enum InPartyClientToServerEvent {
  SelectCombatAction = "0",
  IncrementAttribute = "1",
  ToggleReadyToExplore = "2",
  UnequipSlot = "3",
  EquipInventoryItem = "4",
  CycleCombatActionTargets = "5",
  CycleTargetingSchemes = "6",
  UseSelectedCombatAction = "7",
  DropEquippedItem = "8",
  DropItem = "9",
  ToggleReadyToDescend = "10",
  AssignAttributePoint = "11",
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
  [InPartyClientToServerEvent.CycleCombatActionTargets]: (
    characterId: string,
    direction: NextOrPrevious
  ) => void;
  [InPartyClientToServerEvent.CycleTargetingSchemes]: (characterId: string) => void;
  [InPartyClientToServerEvent.UseSelectedCombatAction]: (characterId: string) => void;
  [InPartyClientToServerEvent.DropEquippedItem]: (characterId: string, slot: EquipmentSlot) => void;
  [InPartyClientToServerEvent.DropItem]: (characterId: string, itemId: string) => void;
  [InPartyClientToServerEvent.ToggleReadyToDescend]: () => void;
  [InPartyClientToServerEvent.AssignAttributePoint]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
}
