import { ToggleAttributeAllocationMenuHiddenButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleAttributeAllocationMenuHiddenButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import ViewAbilityTreeButton from "@/app/game/ActionMenu/menu-state/common-buttons/ViewAbilityTreeButton";
import { ViewItemsOnGroundButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ViewItemsOnGroundButton";
import React from "react";

export class BaseMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.Base);
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
    const { gameStore } = AppStore.get();

    const focusedCharacterOption = gameStore.getFocusedCharacterOption();

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

export function disableButtonBecauseNotThisCombatantTurn(combatantId: string) {
  const { game, party } = AppStore.get().gameStore.getFocusedCharacterContext();

  const battleOption = party.getBattleOption(game);
  let disableButtonBecauseNotThisCombatantTurn = false;

  if (battleOption) {
    disableButtonBecauseNotThisCombatantTurn =
      !battleOption.turnOrderManager.combatantIsFirstInTurnOrder(combatantId);
  }

  return disableButtonBecauseNotThisCombatantTurn;
}
