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
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ItemDetailsWithComparison } from "@/app/components/item-details/ItemDetailsWithComparison";
import { CharacterSheetSubjectProvider } from "../character-sheet-subject-context";
import { PaperDoll } from "../PaperDoll";
import { CharacterAttributes } from "../CharacterAttributes";
import { AbilitySelection } from "../ability-tree";
import { SheetCombatantSelector } from "./SheetCombatantSelector";

// a character and its pets as a page. the in-game sheet's own layout does not transfer: that one is
// sized to sit over the 3d scene beside the action menu, in a fixed-height box, with the ability
// tree as an overlay. here the halves stack and the tree is a section.
// deserialized once per record, because the sheet mutates the combatant in hand when a hotswap slot
// is selected — remaking it on every render would throw that selection away
export const CombatantWithPetsSheet = observer(
  ({ serialized }: { serialized: SerializedCombatantWithPets }) => {
    const { detailableEntityFocus } = useClientApplication();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [viewingAbilityTree, setViewingAbilityTree] = useState(false);

    const combatants = useMemo(() => {
      const { combatant, pets } = combatantWithPetsFromSerialized(serialized);
      const all = [combatant, ...pets];
      for (const deserialized of all) {
        deserialized.makeObservable();
      }
      return all;
    }, [serialized]);

    const selected = combatants[selectedIndex] ?? combatants[0];

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
        <div className="pointer-events-auto pb-32">
          <SheetCombatantSelector
            combatants={combatants}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />

          <div
            className="border border-slate-400 bg-slate-700 flex flex-wrap relative"
            style={{ padding: `${SPACING_REM}rem` }}
          >
            <div className="mr-5">
              <PaperDoll />
            </div>
            <CharacterAttributes />
          </div>

          <div className="flex" style={{ marginTop: `${SPACING_REM}rem` }}>
            <HotkeyButton
              className="border px-2 border-slate-400 bg-slate-700"
              onClick={() => setViewingAbilityTree(!viewingAbilityTree)}
            >
              {viewingAbilityTree ? "Hide Abilities" : "Show Abilities"}
            </HotkeyButton>
          </div>

          {viewingAbilityTree && (
            <div className="relative" style={{ marginTop: `${SPACING_REM}rem` }}>
              <AbilitySelection />
            </div>
          )}

          <div style={{ marginTop: `${SPACING_REM}rem` }}>
            <ItemDetailsWithComparison />
          </div>
        </div>
      </CharacterSheetSubjectProvider>
    );
  }
);
