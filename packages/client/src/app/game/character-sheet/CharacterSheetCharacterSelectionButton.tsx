import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { useAlertStore } from "@/stores/alert-store";
import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import setFocusedCharacter from "@/utils/set-focused-character";
import React from "react";

interface Props {
  characterId: string;
}

export default function CharacterSheetCharacterSelectionButton({ characterId }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const mutateAlertState = useAlertStore().mutateState;
  const partySocketOption = useWebsocketStore().partySocketOption;
  const focusedCharacterId = useGameStore().focusedCharacterId;
  const characterResult = useGameStore().getCharacter(characterId);
  if (characterResult instanceof Error) return <div>{characterResult.message}</div>;
  const character = characterResult;
  const isSelectedStyle =
    focusedCharacterId === character.entityProperties.id ? "border-yellow-400" : "";

  function handleClick() {
    setFocusedCharacter(mutateGameState, mutateAlertState, partySocketOption, characterId);
  }

  return (
    <button
      className={`border border-slate-400 bg-slate-700 w-40 mr-2.5 ${isSelectedStyle}`}
      onClick={handleClick}
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
    >
      {character.entityProperties.name}
    </button>
  );
}
