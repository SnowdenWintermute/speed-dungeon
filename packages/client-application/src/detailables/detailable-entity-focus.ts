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
import { CombatantFocus } from "../combatant-focus";
import { Detailable, DetailableEntity } from "./detailable";

export class DetailableEntityFocus {
  readonly combatantAbilities = new Detailable<AbilityTreeAbility>(() => {
    //
  });
  readonly detailables = new Detailable<DetailableEntity>(() =>
    this.consideredItemUnmetRequirements.clear()
  );

  private comparedItem: null | Item = null;
  private comparedSlot: null | TaggedEquipmentSlot = null;

  private consideredItemUnmetRequirements = new Set<CombatAttribute>();
  private combatantFocus: CombatantFocus | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  initialize(combatantFocus: CombatantFocus) {
    this.combatantFocus = combatantFocus;
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
    }
  }

  requireCombatantFocus() {
    if (this.combatantFocus === null) {
      throw new Error("didn't initialize DetailableEntityFocus class");
    }
    return this.combatantFocus;
  }

  getSelectedItemUnmetRequirements() {
    const detailedItemOption = this.detailables.get();
    if (detailedItemOption === null) {
      return new Set();
    }
    const { hovered, detailed } = detailedItemOption;
    if (hovered === null && detailed === null) {
      return new Set();
    }
    const focusedCharacter = this.requireCombatantFocus().requireFocusedCharacter();
    if (hovered instanceof Item) {
      return focusedCharacter.combatantProperties.attributeProperties.getUnmetItemRequirements(
        hovered
      );
    } else if (detailed instanceof Item) {
      return focusedCharacter.combatantProperties.attributeProperties.getUnmetItemRequirements(
        detailed
      );
    } else {
      return new Set();
    }
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
