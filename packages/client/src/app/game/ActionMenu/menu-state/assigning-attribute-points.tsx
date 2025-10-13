import { useGameStore } from "@/stores/game-store";
import { ActionMenuState } from ".";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  COMBAT_ATTRIBUTE_STRINGS,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { createPageButtons } from "./create-page-buttons";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import { createCancelButton } from "./common-buttons/cancel";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export class AssigningAttributePointsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.AssignAttributePoints, 1);
  }

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

    createPageButtons(toReturn);

    return toReturn;
  }
}
