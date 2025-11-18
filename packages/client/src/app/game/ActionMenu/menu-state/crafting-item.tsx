import { ActionMenuState } from ".";
import { CraftingAction, Equipment, iterateNumericEnum } from "@speed-dungeon/common";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import makeAutoObservable from "mobx-store-inheritance";
import { CraftActionButton } from "./common-buttons/CraftActionButton";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";

const useItemHotkey = HOTKEYS.MAIN_1;
const useItemLetter = letterFromKeyCode(useItemHotkey);
export const USE_CONSUMABLE_BUTTON_TEXT = `Use (${useItemLetter})`;
export const EQUIP_ITEM_BUTTON_TEXT = `Equip (${useItemLetter})`;

export class CraftingItemMenuState extends ActionMenuState {
  constructor(public item: Equipment) {
    super(MenuStateType.CraftingActionSelection);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex w-full">
        <GoBackButton
          extraFn={() => {
            AppStore.get().focusStore.selectItem(null);
          }}
        />
        <ToggleInventoryButton />

        <VendingMachineShardDisplay />
      </ul>
    );
  }

  getNumberedButtons() {
    return iterateNumericEnum(CraftingAction).map((craftingAction, i) => (
      <CraftActionButton
        key={craftingAction}
        equipment={this.item}
        craftingAction={craftingAction}
        listIndex={i}
      />
    ));
  }
}
