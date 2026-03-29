import { Equipment, EquipmentType, Item } from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { ActionMenuScreen } from ".";
import { ModifierKey } from "../../ui/inputs";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuCentralSection,
  ActionMenuCentralSectionType,
} from "../action-menu-display-data";

const ALT_SLOTTABLE_ITEMS = [EquipmentType.Ring, EquipmentType.OneHandedMeleeWeapon];

export class ConsideringItemActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Item
  ) {
    super(clientApplication, ActionMenuScreenType.ItemSelected);
    makeAutoObservable(this);
  }

  private shouldShowEquipAltSlotButton() {
    const { uiStore } = this.clientApplication;
    const modKeyHeld = uiStore.inputs.getKeyIsHeld(ModifierKey.Mod);

    if (modKeyHeld) return false;
    if (!(this.item instanceof Equipment)) return false;

    const { equipmentType } = this.item.equipmentBaseItemProperties.taggedBaseEquipment;
    if (!ALT_SLOTTABLE_ITEMS.includes(equipmentType)) return false;

    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const slotItemIsEquippedTo =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(
        this.item.entityProperties.id
      );
    return slotItemIsEquippedTo === null;
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const buttons: ActionMenuTopSectionItem[] = [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.selectItem(null);
          },
        },
      },
      { type: ActionMenuTopSectionItemType.UseItem, data: { item: this.item } },
    ];

    if (this.shouldShowEquipAltSlotButton()) {
      buttons.push({ type: ActionMenuTopSectionItemType.EquipToAltSlot, data: { item: this.item } });
    }

    buttons.push({ type: ActionMenuTopSectionItemType.DropItem, data: { item: this.item } });

    return buttons;
  }

  getCentralSection(): ActionMenuCentralSection {
    return { type: ActionMenuCentralSectionType.ConsideringItem, data: undefined };
  }

  setItem(item: Item) {
    this.item = item;
    this.clientApplication.detailableEntityFocus.selectItem(null);
  }
}
