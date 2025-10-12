import { useGameStore } from "@/stores/game-store";
import {
  AbilityTreeAbility,
  CombatActionName,
  CombatAttribute,
  Combatant,
  CombatantEquipment,
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  EntityId,
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

  private consideredItemUnmetRequirements: Set<CombatAttribute> = new Set();

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
    this.consideredItemUnmetRequirements.clear();
  }

  clearDetailable() {
    this.clearHovered();
    this.clearDetailed();
  }

  getDetailable() {
    return { detailedEntity: this.detailedEntity, hoveredEntity: this.hoveredEntity };
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
      this.consideredItemUnmetRequirements.clear();
    } else {
      this.detailedEntity = itemOption;

      // @REFACTOR - maybe easier to test if we pass this as an argument instead of fetching it here
      const focusedCharacterResult = useGameStore().getFocusedCharacter();
      if (!(focusedCharacterResult instanceof Error))
        this.consideredItemUnmetRequirements =
          focusedCharacterResult.combatantProperties.getUnmetItemRequirements(itemOption);
    }

    this.hoveredEntity = null;

    return this.detailedEntity === null;
  }

  getSelectedItemUnmetRequirements() {
    return this.consideredItemUnmetRequirements;
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
      this.clearItemComparison();
    } else {
      this.comparedItem = equippedItemOption;
    }
  }

  // COMBATANTS
  updateDetailedCombatant(newCombatant: Combatant) {
    const newCombatantAlreadyDetailed = this.entityIsDetailed(newCombatant.entityProperties.id);

    if (newCombatantAlreadyDetailed) {
      this.clearDetailed();
    } else {
      this.setDetailed(
        new Combatant(newCombatant.entityProperties, newCombatant.combatantProperties)
      );
    }
  }
}
