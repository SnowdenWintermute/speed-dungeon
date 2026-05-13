import { ClientIntentType, CombatantId, CombatantProperties } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "../components/atoms/HoverableTooltipWrapper";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const UnspentAttributesButton = observer(
  ({
    entityId,
    combatantProperties,
  }: {
    entityId: CombatantId;
    combatantProperties: CombatantProperties;
  }) => {
    if (combatantProperties.attributeProperties.getUnspentPoints() < 1) return <></>;

    const clientApplication = useClientApplication();
    const { gameClientRef, actionMenu, combatantFocus } = clientApplication;

    function handleUnspentAttributesButtonClick() {
      const previouslyFocusedCharacterId = combatantFocus.requireFocusedCharacterId();

      if (combatantFocus.clientUserControlsFocusedCombatant()) {
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.SelectCombatAction,
          data: {
            characterId: previouslyFocusedCharacterId,
            actionAndRankOption: null,
          },
        });
      }

      combatantFocus.setFocusedCharacter(entityId);

      if (
        actionMenu.currentMenuIsType(ActionMenuScreenType.AssignAttributePoints) &&
        entityId === previouslyFocusedCharacterId
      ) {
        actionMenu.popStack();
      } else {
        combatantFocus.setFocusedCharacter(entityId);
        actionMenu.clearStack();
        actionMenu.pushFromPool(ActionMenuScreenType.AssignAttributePoints);
      }
    }

    // the actual hotkey button is in the base action menu to avoid
    // the hotkey being available when inventory is open and other times
    // where it would collide with using the hotkey for dropping shards
    const buttonType = HotkeyButtonTypes.ToggleAssignAttributesMenu;
    const { keybinds } = clientApplication.uiStore;

    return (
      <HoverableTooltipWrapper
        tooltipText={`Assign attributes (${keybinds.getKeybindString(buttonType)})`}
      >
        <button
          onClick={handleUnspentAttributesButtonClick}
          className="bg-ffxipink h-5 w-5 border border-slate-400 text-slate-950 text-lg leading-3 ml-1"
        >
          {"+"}
        </button>
      </HoverableTooltipWrapper>
    );
  }
);
