import {
  AbilityTreeAbility,
  CombatActionName,
  CombatAttribute,
  Combatant,
  CombatantEquipment,
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  EntityId,
  EquipableSlots,
  Equipment,
  Item,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export type DetailableEntity = Combatant | Item;

export class FocusStore {
  focusedCharacterId: EntityId | null = null;

  private detailedEntity: null | DetailableEntity = null;
  private hoveredEntity: null | DetailableEntity = null;

  private comparedItem: null | Item = null;
  private comparedSlot: null | TaggedEquipmentSlot = null;

  consideredItemUnmetRequirements: null | CombatAttribute[] = null;

  hoveredAction: null | CombatActionName = null;
  hoveredCombatantAbility: null | AbilityTreeAbility = null;
  detailedCombatantAbility: null | AbilityTreeAbility = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setHovered(detailable: DetailableEntity) {
    this.hoveredEntity = detailable;
  }

  clearHovered() {
    this.hoveredEntity = null;
  }

  setDetailed(detailable: DetailableEntity) {
    this.detailedEntity = detailable;
  }

  clearDetailed() {
    this.detailedEntity = null;
  }

  clearDetailable() {
    this.clearHovered();
    this.clearDetailed();
  }

  entityIsHovered(entityId: string) {
    if (!this.hoveredEntity) return false;
    return this.hoveredEntity.entityProperties.id === entityId;
  }

  entityIsDetailed(entityId: string) {
    if (!this.detailedEntity) return false;
    return this.detailedEntity.entityProperties.id === entityId;
  }

  // ITEMS
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

  getFocusedItems() {
    const hoveredItem = this.hoveredEntity instanceof Item ? this.hoveredEntity : null;
    const detailedItem = this.detailedEntity instanceof Item ? this.detailedEntity : null;
    return { hoveredItem, detailedItem };
  }

  // COMPARED ITEMS
  getItemComparison() {
    return { comparedItem: this.comparedItem, comparedSlot: this.comparedSlot };
  }
  clearItemComparison() {
    this.comparedItem = null;
    this.comparedSlot = null;
  }

  updateItemComparison(
    item: Item,
    compareToAltSlot: boolean,
    combatantEquipment: CombatantEquipment
  ) {
    if (!(item instanceof Equipment)) {
      this.clearItemComparison();
      return;
    }

    const { equipmentType } = item.equipmentBaseItemProperties.taggedBaseEquipment;
    const equipableSlots = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];

    if (equipableSlots.alternate !== null && compareToAltSlot) {
      this.comparedSlot = equipableSlots.alternate;
    } else {
      this.comparedSlot = equipableSlots.main;
    }

    const equippedItemOption = CombatantEquipment.getEquipmentInSlot(
      combatantEquipment,
      this.comparedSlot
    );

    const comparingToSelf = equippedItemOption?.entityProperties.id === item.entityProperties.id;
    const noItemInSlot = !equippedItemOption;

    if (noItemInSlot || comparingToSelf) {
      this.clearComparedItem();
    } else {
      this.comparedItem = equippedItemOption;
    }
  }
}
