import { ACTION_NAMES_TO_HIDE_IN_MENU } from "@speed-dungeon/common";
import { ActionMenuScreenType } from "../screen-types";
import { ActionMenuScreen } from ".";
import { ClientApplication } from "../../";
import makeAutoObservable from "mobx-store-inheritance";
import { ACTION_MENU_PAGE_SIZE } from "../consts";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export class RootActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.Root);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.ViewAbilityTree, data: undefined },
      { type: ActionMenuTopSectionItemType.ViewItemsOnGround, data: undefined },
      { type: ActionMenuTopSectionItemType.ToggleAttributeAllocationMenuHidden, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const { combatantFocus } = this.clientApplication;
    const { focusedCharacterOption } = combatantFocus;

    if (focusedCharacterOption === undefined) {
      return [];
    }

    const focusedCharacter = focusedCharacterOption;
    const { combatantProperties } = focusedCharacter;
    const ownedActions = combatantProperties.abilityProperties.getOwnedActions();

    return [...ownedActions]
      .filter(([actionName, _]) => !ACTION_NAMES_TO_HIDE_IN_MENU.includes(actionName))
      .map(([actionName, _], i) => {
        const buttonNumber = (i % ACTION_MENU_PAGE_SIZE) + 1;
        return {
          type: ActionMenuNumberedButtonType.CombatAction,
          data: {
            actionName,
            user: focusedCharacter,
            hotkeys: [`Digit${buttonNumber}`],
            hotkeyLabel: buttonNumber.toString(),
          },
        };
      });
  }
}
