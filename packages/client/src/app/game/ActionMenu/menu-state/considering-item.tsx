import { ActionMenuState } from ".";
import { Equipment, EquipmentType, Item } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { ModifierKey } from "@/mobx-stores/input";
import { MenuStateType } from "./menu-state-type";
import { ReactNode } from "react";
import GoBackButton from "./common-buttons/GoBackButton";
import makeAutoObservable from "mobx-store-inheritance";
import { UseItemButton } from "./common-buttons/UseItemButton";
import { EquipToAltSlotButton } from "./common-buttons/EquipToAltSlotButton";
import { ConsideringItemDisplay } from "../ConsideringItemDisplay";
import { DropItemButton } from "./common-buttons/DropItemButton";

const ALT_SLOTTABLE_ITEMS = [EquipmentType.Ring, EquipmentType.OneHandedMeleeWeapon];

export class ConsideringItemMenuState extends ActionMenuState {
  constructor(public item: Item) {
    super(MenuStateType.ItemSelected);

    makeAutoObservable(this);
  }

  private shouldShowEquipAltSlotButton() {
    const { inputStore, gameStore } = AppStore.get();
    const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);

    if (modKeyHeld) return false;

    if (!(this.item instanceof Equipment)) return false;
    const { equipmentType } = this.item.equipmentBaseItemProperties.taggedBaseEquipment;
    const altSlotsExistForThisType = ALT_SLOTTABLE_ITEMS.includes(equipmentType);
    if (!altSlotsExistForThisType) return false;

    const focusedCharacter = gameStore.getExpectedFocusedCharacter();
    const slotItemIsEquippedTo =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(
        this.item.entityProperties.id
      );

    return slotItemIsEquippedTo === null;
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            const { focusStore } = AppStore.get();
            focusStore.selectItem(null);
          }}
        />
        <UseItemButton item={this.item} />
        {this.shouldShowEquipAltSlotButton() && <EquipToAltSlotButton item={this.item} />}
        <DropItemButton item={this.item} />
      </ul>
    );
  }

  getCentralSection(): ReactNode {
    return <ConsideringItemDisplay />;
  }

  recalculateButtons(): void {
    return;
  }

  setItem(item: Item) {
    this.item = item;
    AppStore.get().focusStore.selectItem(item);
  }
}
