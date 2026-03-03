import { BUTTON_HEIGHT_SMALL } from "@/client-consts";
import { AppStore } from "@/mobx-stores/app-store";
import { CombatantId } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

interface Props {
  characterId: CombatantId;
}

export const CharacterSheetCharacterSelectionButton = observer(({ characterId }: Props) => {
  const { gameStore } = AppStore.get();
  const isfocused = gameStore.characterIsFocused(characterId);
  const character = gameStore.getExpectedCombatant(characterId);
  const isSelectedStyle = isfocused ? "border-yellow-400" : "";

  function handleClick() {
    gameStore.setFocusedCharacter(characterId);
  }

  return (
    <button
      className={`border border-slate-400 bg-slate-700 w-28 px-2 mr-2.5 ${isSelectedStyle} text-ellipsis overflow-hidden`}
      onClick={handleClick}
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
    >
      {character.entityProperties.name}
    </button>
  );
});
