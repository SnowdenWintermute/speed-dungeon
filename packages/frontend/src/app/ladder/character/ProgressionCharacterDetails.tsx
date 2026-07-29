import React from "react";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  ProgressionCharacterView,
  combatantWithPetsFromSerialized,
} from "@speed-dungeon/common";
import { RecordFactList } from "../detail-page/RecordFactList";
import { LadderLink } from "../LadderLink";
import { playerProfileRoute } from "../routes";
import { classProgressText, supportClassText } from "../class-progress-text";
import { CombatantWithPetsSheet } from "@/app/components/character-sheet/public-sheet/CombatantWithPetsSheet";

export function ProgressionCharacterDetails({
  character,
}: {
  character: ProgressionCharacterView;
}) {
  // the name and classes are read off the combatant itself, which is where the whole build already
  // is — a second denormalized copy of them could disagree with the sheet below
  const { combatant } = combatantWithPetsFromSerialized(character.combatantWithPets);
  const { classProgressionProperties } = combatant.combatantProperties;

  return (
    <main className="pb-32">
      <h1 className="text-2xl mb-4">{combatant.entityProperties.name}</h1>
      <RecordFactList
        facts={[
          {
            label: "Owner",
            value: (
              <LadderLink href={playerProfileRoute(character.ownerUsername)}>
                {character.ownerUsername}
              </LadderLink>
            ),
          },
          {
            label: "Control Scheme",
            value: CHARACTER_CONTROL_SCHEME_STRINGS[character.controlScheme],
          },
        ]}
      />
      <CombatantWithPetsSheet serialized={character.combatantWithPets} />
    </main>
  );
}
