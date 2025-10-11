import {
  AbilityTreeAbility,
  CombatActionName,
  CombatAttribute,
  Combatant,
  EntityId,
  Item,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export type DetailableEntity = Combatant | Item;

export class FocusStore {
  focusedCharacterId: EntityId | null = null;

  private detailedEntity: null | DetailableEntity = null;
  private hoveredEntity: null | DetailableEntity = null;

  comparedItem: null | Item = null;
  comparedSlot: null | TaggedEquipmentSlot = null;

  consideredItemUnmetRequirements: null | CombatAttribute[] = null;

  hoveredAction: null | CombatActionName = null;
  hoveredCombatantAbility: null | AbilityTreeAbility = null;
  detailedCombatantAbility: null | AbilityTreeAbility = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setHovered(detailable: null | DetailableEntity) {
    this.hoveredEntity = detailable;
  }

  clearHovered() {
    this.hoveredEntity = null;
  }

  entityIsHovered(entityId: string) {
    if (!this.hoveredEntity) return false;
    return this.hoveredEntity.entityProperties.id === entityId;
  }

  entityIsDetailed(entityId: string) {
    if (!this.detailedEntity) return false;
    return this.detailedEntity.entityProperties.id === entityId;
  }

  selectItem(itemOption: null | Item) {
    const detailedEntityIdOption = this.detailedEntity?.entityProperties.id;
    const selectedItemOptionId = itemOption?.entityProperties.id;
    const wasAlreadyDetailed = detailedEntityIdOption === selectedItemOptionId;

    if (wasAlreadyDetailed || itemOption === null) {
      this.detailedEntity = null;
      this.consideredItemUnmetRequirements = null;
    } else {
      this.detailedEntity = itemOption;
    }

    this.hoveredEntity = null;

    return this.detailedEntity === null;
  }

  clearDetailable() {
    this.detailedEntity = null;
    this.hoveredEntity = null;
  }
}
