import { setAlert } from "@/app/components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import {
  ClientToServerEvent,
  ERROR_MESSAGES,
  InPartyClientToServerEvent,
} from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatantId: string;
  isFocused: boolean;
}

export default function FocusCharacterButton({ combatantId, isFocused }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const mutateAlertStore = useAlertStore().mutateState;
  const partySocketOption = useWebsocketStore().partySocketOption;
  const conditionalStyles = isFocused ? "bg-slate-400 text-slate-700" : "";
  const username = useLobbyStore().username;

  function handleClick() {
    mutateGameState((store) => {
      const characterSwitchingFocusAwayFromId = store.focusedCharacterId;
      store.selectedItem = null;
      store.focusedCharacterId = combatantId;
      const game = store.game;
      if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (!username) return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const playerOption = game.players[username];
      if (!playerOption)
        return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
      const playerOwnsCharacterSwitchingFocusAwayFrom = Object.keys(
        playerOption.characterIds
      ).includes(combatantId);
      if (playerOwnsCharacterSwitchingFocusAwayFrom) {
        partySocketOption?.emit(
          InPartyClientToServerEvent.SelectCombatAction,
          characterSwitchingFocusAwayFromId,
          null
        );
      }
    });
  }

  return (
    <button
      className={`flex items-center justify-center h-full mr-2 w-20
                   text-sm border border-slate-400 ${conditionalStyles}`}
      onClick={handleClick}
    >
      {isFocused ? "Focused" : "Focus"}
    </button>
  );
}
