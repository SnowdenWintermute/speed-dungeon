import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

export const CycleTargetingSchemesButtons = observer(() => {
  const { gameStore, hotkeysStore } = AppStore.get();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
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
    setAlert(combatActionProperties);
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
    websocketConnection.emit(ClientToServerEvent.CycleTargetingSchemes, { characterId });
  }

  return (
    <ActionMenuTopButton hotkeys={hotkeysStore.getKeybind(buttonType)} handleClick={clickHandler}>
      Targeting Scheme ({hotkeysStore.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
});
