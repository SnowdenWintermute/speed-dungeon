import { SPACING_REM } from "@/client_consts";
import React, { useLayoutEffect, useRef, useState } from "react";
import CharacterSheetTopBar from "./CharacterSheetTopBar";
import { PaperDollAndAttributes } from "./PaperDollAndAttributes";
import AbilitySelection from "./ability-tree";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

export const CharacterSheet = observer(
  ({ showCharacterSheet }: { showCharacterSheet: boolean }) => {
    const { actionMenuStore } = AppStore.get();

    const party = AppStore.get().gameStore.getExpectedParty();

    const partyCharacterIds = party.combatantManager
      .getPartyMemberCharacters()
      .map((combatant) => combatant.getEntityId());

    let conditionalStyles = showCharacterSheet
      ? "pointer-events-auto w-fit "
      : "opacity-0 overflow-hidden pointer-events-none";

    const shouldShowAbilityTree = actionMenuStore.viewingAbilityTree();

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
);
