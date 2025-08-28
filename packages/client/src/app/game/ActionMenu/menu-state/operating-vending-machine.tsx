import {
  convertToShardItemSelectionMenuState,
  craftingItemSelectionMenuState,
  purchasingItemsMenuState,
  repairItemSelectionMenuState,
  selectBooksToTradeForMenuState,
  useGameStore,
} from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { setAlert } from "@/app/components/alerts";
import createPageButtons from "./create-page-buttons";
import { immerable } from "immer";
import { HOTKEYS } from "@/hotkeys";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { createCancelButton } from "./common-buttons/cancel";
import { setInventoryOpen } from "./common-buttons/open-inventory";

export const operateVendingMachineHotkey = HOTKEYS.SIDE_2;

export class OperatingVendingMachineMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.OperatingVendingMachine;
  alwaysShowPageOne = false;
  getCenterInfoDisplayOption = null;
  constructor() {}
  getButtonProperties(): ActionButtonsByCategory {
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
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(purchasingItemsMenuState);
        });
      }
    );
    purchaseItemsButton.shouldBeDisabled = !userControlsThisCharacter;

    const craftButton = new ActionMenuButtonProperties(
      () => "Craft",
      "Craft",
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(craftingItemSelectionMenuState);
        });
      }
    );

    const repairButton = new ActionMenuButtonProperties(
      () => "Repair",
      "Repair",
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(repairItemSelectionMenuState);
        });
      }
    );

    const convertButton = new ActionMenuButtonProperties(
      () => "Convert to Shards",
      "Convert to Shards",
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(convertToShardItemSelectionMenuState);
        });
      }
    );

    const selectBooksButton = new ActionMenuButtonProperties(
      () => "Trade for Books",
      "Trade for Books",
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(selectBooksToTradeForMenuState);
        });
      }
    );

    toReturn[ActionButtonCategory.Numbered].push(purchaseItemsButton);
    toReturn[ActionButtonCategory.Numbered].push(craftButton);
    toReturn[ActionButtonCategory.Numbered].push(repairButton);
    toReturn[ActionButtonCategory.Numbered].push(convertButton);
    toReturn[ActionButtonCategory.Numbered].push(selectBooksButton);

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
