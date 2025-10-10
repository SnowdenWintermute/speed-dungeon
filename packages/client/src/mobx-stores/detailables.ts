import {
  AbilityTreeAbility,
  CombatActionName,
  CombatAttribute,
  Combatant,
  Item,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class DetailablesStore {
  detailedEntity: null | Combatant | Item = null;
  hoveredEntity: null | Combatant | Item = null;

  comparedItem: null | Item = null;
  comparedSlot: null | TaggedEquipmentSlot = null;

  consideredItemUnmetRequirements: null | CombatAttribute[] = null;

  hoveredAction: null | CombatActionName = null;
  hoveredCombatantAbility: null | AbilityTreeAbility = null;
  detailedCombatantAbility: null | AbilityTreeAbility = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
}
