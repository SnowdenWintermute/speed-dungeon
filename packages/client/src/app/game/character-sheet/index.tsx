import { SPACING_REM } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import React, { useLayoutEffect, useRef, useState } from "react";
import CharacterSheetTopBar from "./CharacterSheetTopBar";
import PaperDollAndAttributes from "./PaperDollAndAttributes";
import AbilitySelection from "./ability-tree";
import { viewingAbilityTree } from "@/utils/should-show-character-sheet";

export default function CharacterSheet({ showCharacterSheet }: { showCharacterSheet: boolean }) {
  const currentMenu = useGameStore().getCurrentMenu();
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const partyCharacterIds = partyResult.combatantManager
    .getPartyMemberCharacters()
    .map((combatant) => combatant.getEntityId());

  let conditionalStyles = showCharacterSheet
    ? "pointer-events-auto w-fit "
    : "opacity-0 overflow-hidden pointer-events-none";

  const shouldShowAbilityTree = viewingAbilityTree(currentMenu.type);

  const paperDollAndAttributesRef = useRef<HTMLDivElement>(null);
  const paperDollAndAttributesHiddenStyles = shouldShowAbilityTree ? "invisible absolute" : "";

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
        className={`border border-slate-400 bg-slate-700 flex h-[450px] overflow-y-visible ${showCharacterSheet && "pointer-events-auto"} relative`}
        style={{ padding: `${SPACING_REM}rem` }}
      >
        {shouldShowAbilityTree && (
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
