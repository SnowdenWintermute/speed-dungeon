import { ActionMenuState } from ".";
import { iterateNumericEnumKeyedRecord, ACTION_NAMES_TO_HIDE_IN_MENU } from "@speed-dungeon/common";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import { CombatActionButton } from "./common-buttons/CombatActionButton";
import makeAutoObservable from "mobx-store-inheritance";
import ViewAbilityTreeButton from "./common-buttons/ViewAbilityTreeButton";
import { ViewItemsOnGroundButton } from "./common-buttons/ViewItemsOnGroundButton";
import { ToggleAttributeAllocationMenuHiddenButton } from "./common-buttons/ToggleAttributeAllocationMenuHiddenButton";
import { ACTION_MENU_PAGE_SIZE } from "@/client_consts";

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

  const battleOptionResult = getCurrentBattleOption(game, party.name);
  let disableButtonBecauseNotThisCombatantTurn = false;

  if (battleOptionResult && !(battleOptionResult instanceof Error)) {
    disableButtonBecauseNotThisCombatantTurn =
      !battleOptionResult.turnOrderManager.combatantIsFirstInTurnOrder(combatantId);
  }

  return disableButtonBecauseNotThisCombatantTurn;
}
