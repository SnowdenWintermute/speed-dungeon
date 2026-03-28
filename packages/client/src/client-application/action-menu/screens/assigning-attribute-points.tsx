import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import { ClientApplication } from "@/client-application";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { ActionMenuNumberedButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ActionMenuNumberedButton";
import {
  COMBAT_ATTRIBUTE_STRINGS,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  ClientIntentType,
} from "@speed-dungeon/common";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export class AssigningAttributePointsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.AssignAttributePoints);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraHotkeys={this.clientApplication.uiStore.keybinds.getKeybind(
            HotkeyButtonTypes.ToggleAssignAttributesMenu
          )}
        />
      </ul>
    );
  }

  getNumberedButtons() {
    const { combatantFocus } = this.clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();

    return ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map((attribute, i) => {
      const { attributeProperties } = focusedCharacter.combatantProperties;
      const hasNoUnspentPoints = attributeProperties.getUnspentPoints() === 0;
      const doesNotControlCharacter = !combatantFocus.clientUserControlsFocusedCombatant({
        includePets: true,
      });

      const shouldBeDisabled = hasNoUnspentPoints || doesNotControlCharacter;

      const buttonNumber = i + 1;

      return (
        <ActionMenuNumberedButton
          key={attribute}
          hotkeys={[`Digit${buttonNumber}`]}
          hotkeyLabel={buttonNumber.toString()}
          disabled={shouldBeDisabled}
          clickHandler={() => {
            this.clientApplication.gameClientRef.get().dispatchIntent({
              type: ClientIntentType.IncrementAttribute,
              data: {
                characterId: focusedCharacter.getEntityId(),
                attribute,
              },
            });
          }}
        >
          <div className={`h-full flex items-center px-2 ${shouldBeDisabled && "opacity-50"}`}>
            {COMBAT_ATTRIBUTE_STRINGS[attribute]}
          </div>
        </ActionMenuNumberedButton>
      );
    });
  }
}
