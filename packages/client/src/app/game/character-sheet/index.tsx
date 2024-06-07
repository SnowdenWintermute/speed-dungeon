import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { MenuContext, useGameStore } from "@/stores/game-store";
import { CombatantProperties, ERROR_MESSAGES } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import CharacterSheetCharacterSelectionButton from "./CharacterSheetCharacterSelectionButton";

export default function CharacterSheet() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const menuContext = useGameStore().menuContext;
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;
  const combatantProperties = focusedCharacterOption.combatantProperties;

  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
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
        style={{ padding: `${SPACING_REM}rem; ` }}
      >
        {
          // <PaperDoll equipment={equipment} attributes={combatant_attributes} />
        }
        {
          // if let Some(character) = character_option {
          // <CharacterAttributes
          // entity_properties={character.entity_properties.clone()}
          // combatant_properties={character.combatant_properties.clone()}
          // show_attribute_assignment_buttons={true}
          // />
          // }
        }
      </div>
    </section>
  );
}
