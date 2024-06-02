import React, { useEffect, useState } from "react";
import buildActionButtonProperties, {
  ActionButtonsByCategory,
} from "./build-action-button-properties";
import { useAlertStore } from "@/stores/alert-store";
import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { useUIStore } from "@/stores/ui-store";
import { setAlert } from "@/app/components/alerts";

interface Props {
  setButtonProperties: React.Dispatch<React.SetStateAction<ActionButtonsByCategory>>;
}

export default function ActionMenuChangeDetectionHandler({ setButtonProperties }: Props) {
  const partySocket = useWebsocketStore().partySocketOption;
  if (!partySocket) return <div>{ERROR_MESSAGES.CLIENT.NO_SOCKET_OBJECT}</div>;
  const gameState = useGameStore();
  const uiState = useUIStore();
  const mutateAlertState = useAlertStore().mutateState;

  const [previouslyFocusedCharacterId, setPreviouslyFocusedCharacterId] = useState(
    gameState.focusedCharacterId
  );

  const { focusedCharacterId } = gameState;
  // const activeCombatantResult = getActiveCombatant
  let activeCombatantIdOption = null;
  switch ()

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
      partySocket
    );
    if (updatedButtonPropertiesResult instanceof Error)
      setAlert(mutateAlertState, updatedButtonPropertiesResult.message);
    else setButtonProperties(updatedButtonPropertiesResult);
  }, [focusedCharacterId]);

  return <></>;
}
