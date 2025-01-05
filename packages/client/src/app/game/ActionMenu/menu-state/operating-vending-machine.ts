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

export class OperatingVendingMachineMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.OperatingVendingMachine;
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

    const cancelButton = new ActionMenuButtonProperties("Cancel", () => {
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });

    cancelButton.dedicatedKeys = [HOTKEYS.CANCEL, toggleAssignAttributesHotkey];
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
