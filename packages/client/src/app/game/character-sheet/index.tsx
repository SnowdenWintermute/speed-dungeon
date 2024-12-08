import { SPACING_REM, SPACING_REM_SMALL, UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import {
  CombatantProperties,
  ERROR_MESSAGES,
  INVENTORY_DEFAULT_CAPACITY,
} from "@speed-dungeon/common";
import React, { useMemo } from "react";
import CharacterSheetCharacterSelectionButton from "./CharacterSheetCharacterSelectionButton";
import CharacterAttributes from "./CharacterAttributes";
import PaperDoll from "./PaperDoll";

export default function CharacterSheet({ showCharacterSheet }: { showCharacterSheet: boolean }) {
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;
  const { combatantProperties, entityProperties } = focusedCharacterOption;

  const partyCharacterIds = partyResult.characterPositions;

  const { equipment } = combatantProperties;

  const totalAttributes = useMemo(
    () => CombatantProperties.getTotalAttributes(combatantProperties),
    [combatantProperties]
  );

  let conditionalStyles = showCharacterSheet
    ? "overflow-hidden pointer-events-auto"
    : "opacity-0 w-0 overflow-hidden pointer-events-none";

  const numItemsInInventory = combatantProperties.inventory.items.length;

  return (
    <section className={`w-fit ${conditionalStyles}`}>
      <ul className="flex list-none" style={{ marginBottom: `${SPACING_REM_SMALL}rem ` }}>
        {partyCharacterIds.map((id) => (
          <CharacterSheetCharacterSelectionButton key={id} characterId={id} />
        ))}
      </ul>
      <div
        className={`border border-slate-400 bg-slate-700 overflow-y-auto flex ${showCharacterSheet && "pointer-events-auto"}`}
        style={{ padding: `${SPACING_REM}rem` }}
      >
        <div className="flex flex-col justify-between">
          <PaperDoll equipment={equipment} characterAttributes={totalAttributes} />
          <div
            className={
              numItemsInInventory > INVENTORY_DEFAULT_CAPACITY ? UNMET_REQUIREMENT_TEXT_COLOR : ""
            }
          >
            Inventory Capacity: {numItemsInInventory}/{INVENTORY_DEFAULT_CAPACITY}
          </div>
        </div>
        <CharacterAttributes
          combatant={focusedCharacterOption}
          showAttributeAssignmentButtons={true}
        />
      </div>
    </section>
  );
}
