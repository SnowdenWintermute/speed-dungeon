import { ActionMenuState } from ".";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  COMBAT_ATTRIBUTE_STRINGS,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { MenuStateType } from "./menu-state-type";
import { AppStore } from "@/mobx-stores/app-store";
import GoBackButton from "./common-buttons/GoBackButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { ActionMenuNumberedButton } from "./common-buttons/ActionMenuNumberedButton";
import makeAutoObservable from "mobx-store-inheritance";

export class AssigningAttributePointsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.AssignAttributePoints);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraHotkeys={AppStore.get().hotkeysStore.getKeybind(
            HotkeyButtonTypes.ToggleAssignAttributesMenu
          )}
        />
      </ul>
    );
  }

  getNumberedButtons() {
    const { gameStore } = AppStore.get();
    const focusedCharacter = gameStore.getExpectedFocusedCharacter();

    return ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map((attribute, i) => {
      const { attributeProperties } = focusedCharacter.combatantProperties;
      const hasNoUnspentPoints = attributeProperties.getUnspentPoints() === 0;
      const doesNotControlCharacter = !gameStore.clientUserControlsFocusedCombatant();
      const shouldBeDisabled = hasNoUnspentPoints || doesNotControlCharacter;

      const buttonNumber = i + 1;

      return (
        <ActionMenuNumberedButton
          key={attribute}
          hotkeys={[`Digit${buttonNumber}`]}
          hotkeyLabel={buttonNumber.toString()}
          disabled={shouldBeDisabled}
          clickHandler={() => {
            websocketConnection.emit(ClientToServerEvent.IncrementAttribute, {
              characterId: focusedCharacter.getEntityId(),
              attribute,
            });
          }}
        >
          <div className="h-full flex items-center px-2">{COMBAT_ATTRIBUTE_STRINGS[attribute]}</div>
        </ActionMenuNumberedButton>
      );
    });
  }
}
