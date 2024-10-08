import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { MenuContext, useGameStore } from "@/stores/game-store";
import { AdventuringParty, CombatantProperties, ERROR_MESSAGES } from "@speed-dungeon/common";
import React from "react";
import CharacterSheetCharacterSelectionButton from "./CharacterSheetCharacterSelectionButton";
import CharacterAttributes from "./CharacterAttributes";
import PaperDoll from "./PaperDoll";
import playerOwnsCharacter from "@speed-dungeon/common/src/adventuring_party/player-owns-character";

export default function CharacterSheet() {
  const partyResult = useGameStore().getParty();
  const username = useGameStore().username;
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const menuContext = useGameStore().menuContext;
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;
  const { combatantProperties, entityProperties } = focusedCharacterOption;

  const partyCharacterIds = partyResult.characterPositions;

  const { equipment } = combatantProperties;
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const focusedCharacterHasSelectedAction = combatantProperties.selectedCombatAction !== null;

  const showCharacterSheet =
    (menuContext === MenuContext.InventoryItems ||
      menuContext === MenuContext.Equipment ||
      menuContext === MenuContext.AttributeAssignment) &&
    !focusedCharacterHasSelectedAction;

  let conditionalStyles = showCharacterSheet ? "overflow-hidden" : "opacity-0 w-0 overflow-hidden";

  return (
    <section className={conditionalStyles}>
      <ul
        className="flex list-none pointer-events-auto"
        style={{ marginBottom: `${SPACING_REM_SMALL}rem ` }}
      >
        {partyCharacterIds.map((id) => (
          <CharacterSheetCharacterSelectionButton key={id} characterId={id} />
        ))}
      </ul>
      <div
        className="border border-slate-400 bg-slate-700 overflow-y-auto flex pointer-events-auto"
        style={{ padding: `${SPACING_REM}rem` }}
      >
        <PaperDoll equipment={equipment} characterAttributes={totalAttributes} />
        <CharacterAttributes
          combatantProperties={combatantProperties}
          entityProperties={entityProperties}
          showAttributeAssignmentButtons={true}
        />
      </div>
    </section>
  );
}
