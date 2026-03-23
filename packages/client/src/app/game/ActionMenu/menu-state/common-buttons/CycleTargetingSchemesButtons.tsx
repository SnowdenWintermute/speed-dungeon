import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const CycleTargetingSchemesButtons = observer(() => {
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore, gameClientRef, alertsService } = clientApplication;
  const { keybinds } = uiStore;
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const { combatantProperties } = focusedCharacter;
  const characterId = focusedCharacter.getEntityId();

  const { targetingProperties, abilityProperties } = combatantProperties;

  const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();

  if (selectedActionAndRank === null) {
    return <div />;
  }

  const combatActionProperties =
    abilityProperties.getCombatActionPropertiesIfOwned(selectedActionAndRank);
  if (combatActionProperties instanceof Error) {
    alertsService.setAlert(combatActionProperties);
    return <div />;
  }

  const noTargetingSchemesExist =
    combatActionProperties.targetingProperties.getTargetingSchemes(selectedActionAndRank.rank)
      .length <= 1;

  if (noTargetingSchemesExist) {
    return <div />;
  }

  const buttonType = HotkeyButtonTypes.CycleTargetingSchemes;

  function clickHandler() {
    gameClientRef
      .get()
      .dispatchIntent({ type: ClientIntentType.CycleTargetingSchemes, data: { characterId } });
  }

  return (
    <ActionMenuTopButton hotkeys={keybinds.getKeybind(buttonType)} handleClick={clickHandler}>
      Targeting Scheme ({keybinds.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
});
