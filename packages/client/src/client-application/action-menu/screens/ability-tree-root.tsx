import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import OpenInventoryAsFreshStackButton from "@/app/game/ActionMenu/menu-state/common-buttons/OpenInventoryAsFreshStackButton";
import { ABILITY_TREE_DIMENSIONS, ArrayUtils } from "@speed-dungeon/common";
import { ActionMenuNumberedButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ActionMenuNumberedButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { ClientApplication } from "../..";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import { ConsideringAbilityTreeColumnActionMenuScreen } from "./ability-tree-column";

export class AbilityTreeActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ViewingAbilityTree);
  }

  getTopSection() {
    const hotkeys = this.clientApplication.uiStore.keybinds.getKeybind(
      HotkeyButtonTypes.ToggleViewingAbilityTree
    );

    return (
      <ul className="flex">
        <GoBackButton
          extraHotkeys={hotkeys}
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.combatantAbilities.clear();
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
            clickHandler={() => {
              const { actionMenu } = this.clientApplication;
              actionMenu.pushStack(
                new ConsideringAbilityTreeColumnActionMenuScreen(this.clientApplication, number)
              );
              actionMenu.getCurrentMenu().setPageIndex(number - 1);
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
