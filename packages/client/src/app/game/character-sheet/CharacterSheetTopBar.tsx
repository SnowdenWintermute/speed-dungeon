import { BUTTON_HEIGHT_SMALL, SPACING_REM_SMALL } from "@/client_consts";
import React from "react";
import CharacterSheetCharacterSelectionButton from "./CharacterSheetCharacterSelectionButton";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { useGameStore } from "@/stores/game-store";
import { EntityId } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";

interface Props {
  partyCharacterIds: EntityId[];
}

export default function CharacterSheetTopBar({ partyCharacterIds }: Props) {
  const mutateGameState = useGameStore().mutateState;

  return (
    <div className="flex justify-between">
      <ul className="flex list-none" style={{ marginBottom: `${SPACING_REM_SMALL}rem ` }}>
        {partyCharacterIds.map((id) => (
          <CharacterSheetCharacterSelectionButton key={id} characterId={id} />
        ))}
      </ul>

      <button
        className="p-2 border border-slate-400 cursor-pointer bg-slate-700"
        style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
        aria-label="close inventory"
        onClick={() => {
          AppStore.get().focusStore.combatantAbility.clear();
          mutateGameState((state) => {
            state.stackedMenuStates = [];
          });
        }}
      >
        <XShape className="h-full w-full fill-zinc-300" />
      </button>
    </div>
  );
}
