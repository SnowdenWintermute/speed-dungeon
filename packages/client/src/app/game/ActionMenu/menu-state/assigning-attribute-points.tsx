import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  COMBAT_ATTRIBUTE_STRINGS,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import createPageButtons from "./create-page-buttons";
import { immerable } from "immer";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import { createCancelButton } from "./common-buttons/cancel";

export class AssigningAttributePointsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.AssignAttributePoints;
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

    toReturn[ActionButtonCategory.Top].push(createCancelButton([toggleAssignAttributesHotkey]));

    for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
      const button = new ActionMenuButtonProperties(
        () => COMBAT_ATTRIBUTE_STRINGS[attribute],
        COMBAT_ATTRIBUTE_STRINGS[attribute],
        () => {
          websocketConnection.emit(ClientToServerEvent.IncrementAttribute, {
            characterId,
            attribute,
          });
        }
      );
      button.shouldBeDisabled =
        focusedCharacterResult.combatantProperties.unspentAttributePoints === 0 ||
        !userControlsThisCharacter;
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
