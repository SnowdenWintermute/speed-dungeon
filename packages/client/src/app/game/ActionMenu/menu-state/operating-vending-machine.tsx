import { useGameStore } from "@/stores/game-store";
import { ActionMenuState } from ".";
import { setAlert } from "@/app/components/alerts";
import { createPageButtons } from "./create-page-buttons";
import { HOTKEYS } from "@/hotkeys";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import { createCancelButton } from "./common-buttons/cancel";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { AppStore } from "@/mobx-stores/app-store";
import { MENU_STATE_POOL } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export const operateVendingMachineHotkey = HOTKEYS.SIDE_2;

export class OperatingVendingMachineMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.OperatingVendingMachine, 1);
  }
  getButtonProperties(): ActionButtonsByCategory {
    const { actionMenuStore } = AppStore.get();
    const toReturn = new ActionButtonsByCategory();

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);

    toReturn[ActionButtonCategory.Top].push(createCancelButton([]), setInventoryOpen);

    const purchaseItemsButton = new ActionMenuButtonProperties(
      () => "Purchase Items",
      "Purchase Items",
      () => {
        actionMenuStore.pushStack(MENU_STATE_POOL[MenuStateType.PurchasingItems]);
      }
    );
    purchaseItemsButton.shouldBeDisabled = !userControlsThisCharacter;

    const craftButton = new ActionMenuButtonProperties(
      () => "Craft",
      "Craft",
      () => {
        actionMenuStore.pushStack(MENU_STATE_POOL[MenuStateType.CraftingItemSelection]);
      }
    );

    const repairButton = new ActionMenuButtonProperties(
      () => "Repair",
      "Repair",
      () => {
        actionMenuStore.pushStack(MENU_STATE_POOL[MenuStateType.RepairItemSelection]);
      }
    );

    const convertButton = new ActionMenuButtonProperties(
      () => "Convert to Shards",
      "Convert to Shards",
      () => {
        actionMenuStore.pushStack(MENU_STATE_POOL[MenuStateType.ShardItemSelection]);
      }
    );

    const selectBooksButton = new ActionMenuButtonProperties(
      () => "Trade for Books",
      "Trade for Books",
      () => {
        actionMenuStore.pushStack(MENU_STATE_POOL[MenuStateType.SelectingBookType]);
      }
    );

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }
    const vendingMachineLevel = partyResult.dungeonExplorationManager.getCurrentFloor();
    const vmLevelLimiter = Math.floor(vendingMachineLevel / 2);

    selectBooksButton.shouldBeDisabled = vmLevelLimiter < 1;

    toReturn[ActionButtonCategory.Numbered].push(purchaseItemsButton);
    toReturn[ActionButtonCategory.Numbered].push(craftButton);
    toReturn[ActionButtonCategory.Numbered].push(repairButton);
    toReturn[ActionButtonCategory.Numbered].push(convertButton);
    toReturn[ActionButtonCategory.Numbered].push(selectBooksButton);

    createPageButtons(toReturn);

    return toReturn;
  }
}
