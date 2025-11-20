import { ActionMenuState } from ".";
import { ConsideringAbilityTreeColumnMenuState } from "./considering-tree-ability-column";
import { ABILITY_TREE_DIMENSIONS, ArrayUtils } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ReactNode } from "react";
import GoBackButton from "./common-buttons/GoBackButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import OpenInventoryAsFreshStackButton from "./common-buttons/OpenInventoryAsFreshStackButton";
import { ActionMenuNumberedButton } from "./common-buttons/ActionMenuNumberedButton";

export const toggleAbilityTreeHotkeys = AppStore.get().hotkeysStore.getKeybind(
  HotkeyButtonTypes.ToggleViewingAbilityTree
);

export class AbilityTreeMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.ViewingAbilityTree);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton
          extraHotkeys={toggleAbilityTreeHotkeys}
          extraFn={() => {
            AppStore.get().focusStore.combatantAbilities.clear();
          }}
        />
        <OpenInventoryAsFreshStackButton />
      </ul>
    );
  }

  getNumberedButtons() {
    return ArrayUtils.createFilledWithSequentialNumbers(ABILITY_TREE_DIMENSIONS.x, 1).map(
      (number) => {
        const nameAsString = `Column ${number}`;

        return (
          <ActionMenuNumberedButton
            key={number}
            hotkeys={[`Digit${number}`]}
            hotkeyLabel={number.toString()}
            extraStyles={""}
            focusHandler={() => {}}
            blurHandler={() => {}}
            clickHandler={() => {
              const { actionMenuStore } = AppStore.get();
              actionMenuStore.pushStack(new ConsideringAbilityTreeColumnMenuState(number));
              actionMenuStore.getCurrentMenu().setPageIndex(number - 1);
            }}
          >
            <div className="flex justify-between h-full w-full px-2">
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {nameAsString}
              </div>
            </div>
          </ActionMenuNumberedButton>
        );
      }
    );
  }
}
