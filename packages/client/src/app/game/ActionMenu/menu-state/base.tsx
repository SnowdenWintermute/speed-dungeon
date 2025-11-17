import { ACTION_MENU_PAGE_SIZE, ActionMenuState } from ".";
import { iterateNumericEnumKeyedRecord, ACTION_NAMES_TO_HIDE_IN_MENU } from "@speed-dungeon/common";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import { CombatActionButton } from "./common-buttons/CombatActionButton";
import makeAutoObservable from "mobx-store-inheritance";
import ViewAbilityTreeButton from "./common-buttons/ViewAbilityTreeButton";

export const viewItemsOnGroundHotkey = HOTKEYS.ALT_1;

export const VIEW_LOOT_BUTTON_TEXT = `Loot (${letterFromKeyCode(viewItemsOnGroundHotkey)})`;

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
      </ul>
    );
  }

  getNumberedButtons() {
    const { gameStore } = AppStore.get();

    const focusedCharacterOption = gameStore.getFocusedCharacterOption();

    if (focusedCharacterOption === undefined) {
      return [];
    }

    const focusedCharacter = focusedCharacterOption;
    const { combatantProperties } = focusedCharacter;

    const ownedActions = combatantProperties.abilityProperties.getOwnedActions();

    return iterateNumericEnumKeyedRecord(ownedActions)
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

  getButtonProperties(): ActionButtonsByCategory {
    const { gameStore } = AppStore.get();
    const toReturn = new ActionButtonsByCategory();

    const focusedCharacterOption = gameStore.getFocusedCharacterOption();

    if (focusedCharacterOption === undefined) {
      // this happens because there is a circular dependency between initializing
      // action menu store and focusing a character
      return toReturn;
    }

    const focusedCharacter = focusedCharacterOption;

    const { combatantProperties } = focusedCharacter;

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
