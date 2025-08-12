import { SPACING_REM } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import React, { useLayoutEffect, useRef, useState } from "react";
import CharacterSheetTopBar from "./CharacterSheetTopBar";
import PaperDollAndAttributes from "./PaperDollAndAttributes";
import AbilitySelection from "./AbilitySelection";
import { MenuStateType } from "../ActionMenu/menu-state";

export default function CharacterSheet({ showCharacterSheet }: { showCharacterSheet: boolean }) {
  const mutateGameState = useGameStore().mutateState;
  const viewingDropShardsModal = useGameStore((state) => state.viewingDropShardsModal);
  const currentMenu = useGameStore().getCurrentMenu();
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const partyCharacterIds = partyResult.characterPositions;

  let conditionalStyles = showCharacterSheet
    ? "pointer-events-auto w-fit "
    : "opacity-0 overflow-hidden pointer-events-none";

  const viewingAbilityTree = currentMenu.type === MenuStateType.ViewingAbilityTree;

  const paperDollAndAttributesRef = useRef<HTMLDivElement>(null);
  const paperDollAndAttributesHiddenStyles = viewingAbilityTree ? "invisible absolute" : "";

  const [menuWidth, setMenuWidth] = useState<number>();
  useLayoutEffect(() => {
    if (paperDollAndAttributesRef.current) {
      setMenuWidth(paperDollAndAttributesRef.current.offsetWidth);
    }
  }, []);

  return (
    <section className={`${conditionalStyles}`}>
      <CharacterSheetTopBar partyCharacterIds={partyCharacterIds} />
      <div
        className={`border border-slate-400 bg-slate-700 flex h-[400px] overflow-y-visible ${showCharacterSheet && "pointer-events-auto"} relative`}
        style={{ padding: `${SPACING_REM}rem` }}
      >
        {viewingAbilityTree && (
          <div style={{ width: `${menuWidth || 0}px` }} className="h-fit bg-green-50">
            <AbilitySelection />
          </div>
        )}

        <div
          className={`flex ${paperDollAndAttributesHiddenStyles}`}
          ref={paperDollAndAttributesRef}
        >
          <PaperDollAndAttributes />
        </div>
      </div>
    </section>
  );
}
