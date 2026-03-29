import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import { ClientApplication } from "../../";
import {
  COMBAT_ATTRIBUTE_STRINGS,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  ClientIntentType,
} from "@speed-dungeon/common";
import { HotkeyButtonTypes } from "../../ui/keybind-config";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export class AssigningAttributePointsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.AssignAttributePoints);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const extraHotkeys = this.clientApplication.uiStore.keybinds.getKeybind(
      HotkeyButtonTypes.ToggleAssignAttributesMenu
    );
    return [{ type: ActionMenuTopSectionItemType.GoBack, data: { extraHotkeys } }];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const { combatantFocus } = this.clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();

    return ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map((attribute, i) => {
      const { attributeProperties } = focusedCharacter.combatantProperties;
      const hasNoUnspentPoints = attributeProperties.getUnspentPoints() === 0;
      const doesNotControlCharacter = !combatantFocus.clientUserControlsFocusedCombatant({ includePets: true });
      const disabled = hasNoUnspentPoints || doesNotControlCharacter;

      return {
        type: ActionMenuNumberedButtonType.AssignAttributePoint as const,
        data: {
          attribute,
          label: COMBAT_ATTRIBUTE_STRINGS[attribute],
          disabled,
          onClick: () => {
            this.clientApplication.gameClientRef.get().dispatchIntent({
              type: ClientIntentType.IncrementAttribute,
              data: { characterId: focusedCharacter.getEntityId(), attribute },
            });
          },
        },
      };
    });
  }
}
