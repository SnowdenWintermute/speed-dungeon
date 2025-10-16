import { ActionMenuState } from ".";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  COMBAT_ATTRIBUTE_STRINGS,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { createPageButtons } from "./create-page-buttons";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import { createCancelButton } from "./common-buttons/cancel";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";
import { AppStore } from "@/mobx-stores/app-store";

export class AssigningAttributePointsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.AssignAttributePoints, 1);
  }

  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const { gameStore } = AppStore.get();
    const focusedCharacter = gameStore.getExpectedFocusedCharacter();

    toReturn[ActionButtonCategory.Top].push(createCancelButton([toggleAssignAttributesHotkey]));

    for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
      const button = new ActionMenuButtonProperties(
        () => COMBAT_ATTRIBUTE_STRINGS[attribute],
        COMBAT_ATTRIBUTE_STRINGS[attribute],
        () => {
          websocketConnection.emit(ClientToServerEvent.IncrementAttribute, {
            characterId: focusedCharacter.getEntityId(),
            attribute,
          });
        }
      );

      const hasNoUnspentPoints = focusedCharacter.combatantProperties.unspentAttributePoints === 0;
      const doesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant();
      button.shouldBeDisabled = hasNoUnspentPoints || doesNotControlCharacter;

      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(toReturn);

    return toReturn;
  }
}
