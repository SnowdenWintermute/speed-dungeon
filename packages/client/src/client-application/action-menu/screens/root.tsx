import { ToggleAttributeAllocationMenuHiddenButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleAttributeAllocationMenuHiddenButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { ViewAbilityTreeButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ViewAbilityTreeButton";
import { ViewItemsOnGroundButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ViewItemsOnGroundButton";
import React from "react";
import { ActionMenuScreenType } from "../screen-types";
import { ActionMenuScreen } from ".";
import { ClientApplication } from "@/client-application";
import makeAutoObservable from "mobx-store-inheritance";
import { ACTION_NAMES_TO_HIDE_IN_MENU } from "@speed-dungeon/common";
import { ACTION_MENU_PAGE_SIZE } from "@/client-consts";
import { CombatActionButton } from "@/app/game/ActionMenu/menu-state/common-buttons/CombatActionButton";

export class RootActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.Root);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <ToggleInventoryButton />
        <ViewAbilityTreeButton />
        <ViewItemsOnGroundButton />
        <ToggleAttributeAllocationMenuHiddenButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const { combatantFocus } = this.clientApplication;
    const { focusedCharacterOption } = combatantFocus;

    // this happens because there is a circular dependency between initializing
    // action menu store and focusing a character
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
        return (
          <CombatActionButton
            key={actionName}
            hotkeys={[`Digit${buttonNumber}`]}
            hotkeyLabel={buttonNumber.toString()}
            user={focusedCharacter}
            actionName={actionName}
          />
        );
      });
  }
}
