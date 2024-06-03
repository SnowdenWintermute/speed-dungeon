import React, { useEffect, useState } from "react";
import buildActionButtonProperties, {
  ActionButtonPropertiesByCategory,
} from "./build-action-button-properties";
import { useAlertStore } from "@/stores/alert-store";
import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { useUIStore } from "@/stores/ui-store";
import { setAlert } from "@/app/components/alerts";
import getActiveCombatant from "@/utils/getActiveCombatant";
import getFocusedCharacter from "@/utils/getFocusedCharacter";

interface Props {
  setButtonProperties: React.Dispatch<React.SetStateAction<ActionButtonPropertiesByCategory>>;
}

export default function ActionMenuChangeDetectionHandler({ setButtonProperties }: Props) {
  const partySocketOption = useWebsocketStore().partySocketOption;
  const gameState = useGameStore();
  const uiState = useUIStore();
  const mutateAlertState = useAlertStore().mutateState;

  const [previouslyFocusedCharacterId, setPreviouslyFocusedCharacterId] = useState(
    gameState.focusedCharacterId
  );

  // extract from the gameState anything that we should watch for changes
  const { focusedCharacterId, menuContext, selectedItem } = gameState;
  const activeCombatantResult = getActiveCombatant(gameState);
  const activeCombatantIdOption =
    activeCombatantResult instanceof Error
      ? null
      : activeCombatantResult?.entityProperties.id ?? null;
  const focusedCharacterResult = getFocusedCharacter(gameState);
  const actionTargetOption =
    focusedCharacterResult instanceof Error
      ? null
      : focusedCharacterResult.combatantProperties.combatActionTarget;

  useEffect(() => {
    if (previouslyFocusedCharacterId != focusedCharacterId)
      gameState.mutateState((store) => {
        store.actionMenuCurrentPageNumber = 0;
        store.actionMenuParentPageNumbers = [];
      });

    setPreviouslyFocusedCharacterId(focusedCharacterId);

    const updatedButtonPropertiesResult = buildActionButtonProperties(
      gameState,
      uiState,
      mutateAlertState,
      partySocketOption
    );

    console.log("menucontext", gameState.menuContext);
    if (updatedButtonPropertiesResult instanceof Error)
      setAlert(mutateAlertState, updatedButtonPropertiesResult.message);
    else setButtonProperties(updatedButtonPropertiesResult);
  }, [focusedCharacterId, activeCombatantIdOption, menuContext, actionTargetOption]);

  return <></>;
}
