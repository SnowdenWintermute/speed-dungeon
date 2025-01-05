import { useGameStore } from "@/stores/game-store";
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
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import {
  CONSUMABLE_TYPE_STRINGS,
  ConsumableType,
  getConsumableShardPrice,
} from "@speed-dungeon/common";

export class PurchaseItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.PurchasingItems;
  constructor() {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);

    const cancelButton = new ActionMenuButtonProperties("Cancel", () => {
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });

    cancelButton.dedicatedKeys = [HOTKEYS.CANCEL, toggleAssignAttributesHotkey];
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    const purchaseableItems = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
    for (const consumableType of purchaseableItems) {
      const price = getConsumableShardPrice(partyResult.currentFloor, consumableType);
      // @TODO - get price, display it, disable if too expensive
      const purchaseItemButton = new ActionMenuButtonProperties(
        `${CONSUMABLE_TYPE_STRINGS[consumableType]} (${price} shards)`,
        () => {}
      );
      purchaseItemButton.shouldBeDisabled =
        !userControlsThisCharacter ||
        focusedCharacterResult.combatantProperties.inventory.shards < price;
      toReturn[ActionButtonCategory.Numbered].push(purchaseItemButton);
    }

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
