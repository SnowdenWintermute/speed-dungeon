import { ActionMenuScreen } from ".";
import { Equipment, EquipmentType, Item } from "@speed-dungeon/common";
import { ModifierKey } from "@/mobx-stores/input";
import { ReactNode } from "react";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "@/client-application";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { UseItemButton } from "@/app/game/ActionMenu/menu-state/common-buttons/UseItemButton";
import { DropItemButton } from "@/app/game/ActionMenu/menu-state/common-buttons/DropItemButton";
import { EquipToAltSlotButton } from "@/app/game/ActionMenu/menu-state/common-buttons/EquipToAltSlotButton";
import { ConsideringItemDisplay } from "@/app/game/ActionMenu/ConsideringItemDisplay";

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
    const { inputStore } = this.clientApplication;
    const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);

    if (modKeyHeld) {
      return false;
    }

    if (!(this.item instanceof Equipment)) {
      return false;
    }
    const { equipmentType } = this.item.equipmentBaseItemProperties.taggedBaseEquipment;
    const altSlotsExistForThisType = ALT_SLOTTABLE_ITEMS.includes(equipmentType);
    if (!altSlotsExistForThisType) {
      return false;
    }

    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const slotItemIsEquippedTo =
      focusedCharacter.combatantProperties.equipment.getSlotItemIsEquippedTo(
        this.item.entityProperties.id
      );

    return slotItemIsEquippedTo === null;
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.selectItem(null);
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

  setItem(item: Item) {
    this.item = item;
    this.clientApplication.detailableEntityFocus.selectItem(null);
  }
}
