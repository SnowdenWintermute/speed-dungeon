"use client";
import React, { useMemo, useState } from "react";
import {
  SerializedCombatantWithPets,
  combatantWithPetsFromSerialized,
} from "@speed-dungeon/common";
import { ReadOnlyCharacterSheetSubject } from "@/client-application/character-sheet/read-only-character-sheet-subject";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { SPACING_REM } from "@/client-consts";
import { CharacterSheetSubjectProvider } from "../character-sheet-subject-context";
import { PaperDoll } from "../PaperDoll";
import { CharacterAttributes } from "../CharacterAttributes";
import { AbilitySelection } from "../ability-tree";
import { SheetCombatantSelector } from "./SheetCombatantSelector";
import { ItemDetailsOverlay } from "./ItemDetailsOverlay";

export const CombatantWithPetsSheet = observer(
  ({ serialized }: { serialized: SerializedCombatantWithPets }) => {
    const { detailableEntityFocus } = useClientApplication();
    const [selectedIndex, setSelectedIndex] = useState(0);

    const combatants = useMemo(() => {
      const { combatant, pets } = combatantWithPetsFromSerialized(serialized);
      const all = [combatant, ...pets];
      for (const deserialized of all) {
        deserialized.makeObservable();
      }
      return all;
    }, [serialized]);

    const selected = combatants[selectedIndex] ?? combatants[0];

    const { hoveredItem, detailedItem } = detailableEntityFocus.getFocusedItems();
    const dimmedWhileReadingItemClass = hoveredItem || detailedItem ? "opacity-50" : "";

    const subject = useMemo(() => {
      if (selected === undefined) {
        return null;
      }
      return new ReadOnlyCharacterSheetSubject(selected, detailableEntityFocus);
    }, [selected, detailableEntityFocus]);

    if (subject === null) {
      return <p className="text-slate-400">This record holds no combatant.</p>;
    }

    return (
      <CharacterSheetSubjectProvider subject={subject}>
        <div className="pointer-events-auto ">
          <SheetCombatantSelector
            combatants={combatants}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />

          <div
            className="border border-slate-400 bg-slate-700 flex flex-wrap relative h-[460px]"
            style={{ padding: `${SPACING_REM}rem` }}
          >
            <div className={`mr-5 ${dimmedWhileReadingItemClass} `}>
              <PaperDoll />
            </div>
            <div className="relative">
              <div className={dimmedWhileReadingItemClass}>
                <CharacterAttributes />
              </div>
              <ItemDetailsOverlay />
            </div>
          </div>

          <div style={{ marginTop: `${SPACING_REM}rem` }}>
            <AbilitySelection />
          </div>
        </div>
      </CharacterSheetSubjectProvider>
    );
  }
);
