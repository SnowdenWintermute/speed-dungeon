import { ACTION_MENU_PAGE_SIZE, ActionMenuState } from ".";
import { iterateNumericEnumKeyedRecord, ACTION_NAMES_TO_HIDE_IN_MENU } from "@speed-dungeon/common";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import {
  setInventoryOpen,
  setViewingAbilityTreeAsFreshStack,
} from "./common-buttons/open-inventory";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import { createPageButtons } from "./create-page-buttons";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ReactNode } from "react";
import OpenInventoryButton from "./common-buttons/OpenInventory";
import { CombatActionButton } from "./common-buttons/CombatActionButton";

export const viewItemsOnGroundHotkey = HOTKEYS.ALT_1;

export const VIEW_LOOT_BUTTON_TEXT = `Loot (${letterFromKeyCode(viewItemsOnGroundHotkey)})`;

export class BaseMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.Base, 1);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <OpenInventoryButton />
      </ul>
    );
  }

  recalculateButtons() {
    const { gameStore } = AppStore.get();

    const focusedCharacterOption = gameStore.getFocusedCharacterOption();

    if (focusedCharacterOption === undefined) {
      this.numberedButtons = [];
      return;
    }

    const focusedCharacter = focusedCharacterOption;
    const { combatantProperties } = focusedCharacter;

    const ownedActions = combatantProperties.abilityProperties.getOwnedActions();

    this.numberedButtons = iterateNumericEnumKeyedRecord(ownedActions)
      .filter(([actionName, _]) => !ACTION_NAMES_TO_HIDE_IN_MENU.includes(actionName))
      .map(([actionName, _], i) => (
        <CombatActionButton
          key={actionName}
          hotkeys={[`Digit${i + 1}`]}
          hotkeyLabel={(i + 1).toString()}
          user={focusedCharacter}
          actionName={actionName}
        />
      ));
  }

  getNumberedButtons(): ReactNode[] {
    const startIndex = ACTION_MENU_PAGE_SIZE * this.pageIndex;
    const endIndex = startIndex + ACTION_MENU_PAGE_SIZE;
    return this.numberedButtons.slice(startIndex, endIndex);
  }

  getButtonProperties(): ActionButtonsByCategory {
    const { gameStore } = AppStore.get();
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const focusedCharacterOption = gameStore.getFocusedCharacterOption();

    if (focusedCharacterOption === undefined) {
      // this happens because there is a circular dependency between initializing
      // action menu store and focusing a character
      return toReturn;
    }

    const focusedCharacter = focusedCharacterOption;

    const { combatantProperties, entityProperties } = focusedCharacter;
    const characterId = entityProperties.id;

    toReturn[ActionButtonCategory.Top].push(setViewingAbilityTreeAsFreshStack);

    const partyResult = gameStore.getExpectedParty();

    if (combatantProperties.attributeProperties.getUnspentPoints() > 0) {
      const hiddenButtonForUnspentAttributesHotkey = new ActionMenuButtonProperties(
        () => "Unspent Attributes Hotkey Button",
        "Unspent Attributes Hotkey Button",
        () => {
          const { actionMenuStore } = AppStore.get();
          actionMenuStore.clearHoveredAction();
          actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.AssignAttributePoints));
        }
      );
      hiddenButtonForUnspentAttributesHotkey.dedicatedKeys = [toggleAssignAttributesHotkey];
      toReturn[ActionButtonCategory.Hidden].push(hiddenButtonForUnspentAttributesHotkey);
    }

    if (partyResult.currentRoom.inventory.getItems().length) {
      const viewItemsOnGroundButton = new ActionMenuButtonProperties(
        () => VIEW_LOOT_BUTTON_TEXT,
        VIEW_LOOT_BUTTON_TEXT,
        () => {
          AppStore.get().actionMenuStore.clearHoveredAction();
          AppStore.get().actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.ItemsOnGround));
        }
      );
      viewItemsOnGroundButton.dedicatedKeys = [viewItemsOnGroundHotkey];
      toReturn[ActionButtonCategory.Top].push(viewItemsOnGroundButton);
    }

    // disabled abilities if not their turn in a battle
    const disabledBecauseNotThisCombatantTurnResult =
      disableButtonBecauseNotThisCombatantTurn(characterId);

    const inCombat = partyResult.combatantManager.monstersArePresent();

    const numberedButtonsCount = toReturn[ActionButtonCategory.Numbered].length;
    const pageCount = Math.ceil(numberedButtonsCount / ACTION_MENU_PAGE_SIZE);
    const newCount = Math.max(this.minPageCount, pageCount);
    this.setCachedPageCount(newCount);

    createPageButtons(toReturn);

    return toReturn;
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
