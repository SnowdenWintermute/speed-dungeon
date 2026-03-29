import { ABILITY_TREE_DIMENSIONS, ArrayUtils } from "@speed-dungeon/common";
import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import { ConsideringAbilityTreeColumnActionMenuScreen } from "./ability-tree-column";
import { HotkeyButtonTypes } from "../../ui/keybind-config";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export class AbilityTreeActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ViewingAbilityTree);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const extraHotkeys = this.clientApplication.uiStore.keybinds.getKeybind(
      HotkeyButtonTypes.ToggleViewingAbilityTree
    );
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraHotkeys,
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.combatantAbilities.clear();
          },
        },
      },
      { type: ActionMenuTopSectionItemType.OpenInventoryAsFreshStack, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    return ArrayUtils.createFilledWithSequentialNumbers(ABILITY_TREE_DIMENSIONS.x, 1).map((number) => ({
      type: ActionMenuNumberedButtonType.AbilityTreeColumn as const,
      data: {
        columnNumber: number,
        onClick: () => {
          const { actionMenu } = this.clientApplication;
          actionMenu.pushStack(
            new ConsideringAbilityTreeColumnActionMenuScreen(this.clientApplication, number)
          );
          actionMenu.getCurrentMenu().setPageIndex(number - 1);
        },
      },
    }));
  }
}
