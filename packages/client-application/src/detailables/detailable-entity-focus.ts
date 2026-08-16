import {
  AbilityTreeAbility,
  CombatAttribute,
  Combatant,
  CombatantEquipment,
  Equipment,
  EquipmentSlotId,
  Item,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { Detailable, DetailableEntity } from "./detailable";

export class DetailableEntityFocus {
  readonly combatantAbilities = new Detailable<AbilityTreeAbility>(() => {
    //
  });
  readonly detailables = new Detailable<DetailableEntity>(() =>
    this.consideredItemUnmetRequirements.clear()
  );

  private comparedItem: null | Item = null;
  private comparedSlotId: null | EquipmentSlotId = null;

  private consideredItemUnmetRequirements = new Set<CombatAttribute>();

  constructor() {
    makeAutoObservable(this);
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

  // measured against whoever the sheet is about rather than against a focused character, so a
  // combatant nobody controls — an inspected monster, a character on a ladder page — reads its own
  // requirements
  getSelectedItemUnmetRequirements(combatant: Combatant) {
    const detailedItemOption = this.detailables.get();
    if (detailedItemOption === null) {
      return new Set<CombatAttribute>();
    }
    const { hovered, detailed } = detailedItemOption;

    const { attributeProperties } = combatant.combatantProperties;

    if (hovered instanceof Item) {
      return attributeProperties.getUnmetItemRequirements(hovered);
    }
    if (detailed instanceof Item) {
      return attributeProperties.getUnmetItemRequirements(detailed);
    }
    return new Set<CombatAttribute>();
  }

  getFocusedItems() {
    const { hovered, detailed } = this.detailables.get();
    const hoveredItem = hovered instanceof Item ? hovered : null;
    const detailedItem = detailed instanceof Item ? detailed : null;
    return { hoveredItem, detailedItem };
  }

  // COMPARED ITEMS
  getItemComparison() {
    return { comparedItem: this.comparedItem, comparedSlotId: this.comparedSlotId };
  }

  clearItemComparison() {
    this.comparedItem = null;
    this.comparedSlotId = null;
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

    const { equipmentType } = item.equipmentBaseItemProperties;
    const equipableSlots = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];

    if (equipableSlots.alternate !== null && compareToAltSlot) {
      this.comparedSlotId = equipableSlots.alternate;
    } else {
      this.comparedSlotId = equipableSlots.main;
    }

    const equippedItemOption =
      this.comparedSlotId !== null
        ? combatantEquipment.getEquipmentInSlot(this.comparedSlotId)
        : null;

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
