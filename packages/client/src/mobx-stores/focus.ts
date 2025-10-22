import {
  AbilityTreeAbility,
  CombatAttribute,
  Combatant,
  CombatantEquipment,
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  Equipment,
  Item,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { AppStore } from "./app-store";

export type DetailableEntity = Combatant | Item;

export class FocusStore {
  readonly combatantAbilities = new Detailable<AbilityTreeAbility>(() => {});
  readonly detailables = new Detailable<DetailableEntity>(() =>
    this.consideredItemUnmetRequirements.clear()
  );

  private comparedItem: null | Item = null;
  private comparedSlot: null | TaggedEquipmentSlot = null;

  private consideredItemUnmetRequirements: Set<CombatAttribute> = new Set();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  entityIsHovered(entityId: string) {
    const { hovered } = this.detailables.get();
    if (!hovered) return false;
    return hovered.entityProperties.id === entityId;
  }

  entityIsDetailed(entityId: string) {
    const { detailed } = this.detailables.get();
    if (!detailed) return false;
    return detailed.entityProperties.id === entityId;
  }

  // ITEMS
  selectItem(itemOption: null | Item) {
    const detailedEntityIdOption = this.detailables.get().detailed?.entityProperties.id;
    const selectedItemOptionId = itemOption?.entityProperties.id;
    const wasAlreadyDetailed = detailedEntityIdOption === selectedItemOptionId;

    if (wasAlreadyDetailed || itemOption === null) {
      this.detailables.clearDetailed();
    } else {
      this.detailables.setDetailed(itemOption);

      // @REFACTOR - maybe easier to test if we pass this as an argument instead of fetching it here
      const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
      this.consideredItemUnmetRequirements =
        focusedCharacter.combatantProperties.getUnmetItemRequirements(itemOption);
    }
  }

  getSelectedItemUnmetRequirements() {
    return this.consideredItemUnmetRequirements;
  }

  getFocusedItems() {
    const { hovered, detailed } = this.detailables.get();
    const hoveredItem = hovered instanceof Item ? hovered : null;
    const detailedItem = detailed instanceof Item ? detailed : null;
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

    const equippedItemOption = combatantEquipment.getEquipmentInSlot(this.comparedSlot);

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
      this.detailables.clear();
    } else {
      this.detailables.setDetailed(
        Combatant.createInitialized(newCombatant.entityProperties, newCombatant.combatantProperties)
      );
    }
  }
}

class Detailable<T> {
  private hovered: null | T = null;
  private detailed: null | T = null;

  constructor(private onClearDetailed: () => void) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setHovered(toSet: T) {
    this.hovered = toSet;
  }

  setDetailed(toSet: T) {
    this.detailed = toSet;
  }

  get() {
    return { detailed: this.detailed, hovered: this.hovered };
  }

  getIfInstanceOf<K extends new (...args: any[]) => any>(kind: K) {
    const detailed = this.detailed instanceof kind ? this.detailed : null;
    const hovered = this.hovered instanceof kind ? this.hovered : null;
    return { hovered, detailed };
  }

  clearHovered() {
    this.hovered = null;
  }

  clearDetailed() {
    this.detailed = null;
    this.onClearDetailed();
  }

  clear() {
    this.clearHovered();
    this.clearDetailed();
  }
}
