import React from "react";
import { CharacterFloorClearSnapshotView } from "@speed-dungeon/common";
import { RecordFactList } from "../detail-page/RecordFactList";
import { LadderLink } from "../LadderLink";
import { progressionCharacterRoute } from "../routes";
import { CombatantWithPetsSheet } from "@/app/components/character-sheet/public-sheet/CombatantWithPetsSheet";

export function CharacterSnapshotDetails({
  snapshot,
}: {
  snapshot: CharacterFloorClearSnapshotView;
}) {
  return (
    <>
      <h1 className="text-2xl mb-4">{snapshot.characterName}</h1>
      <RecordFactList
        facts={[
          {
            // where the character stands now, as against this frozen moment of it. the link can
            // lead nowhere — a character deleted since the clear — which is what that page's
            // missing-record branch is for
            label: "Character",
            value: (
              <LadderLink href={progressionCharacterRoute(snapshot.characterRecordId)}>
                {snapshot.characterName}
              </LadderLink>
            ),
          },
        ]}
      />
      <CombatantWithPetsSheet serialized={snapshot.combatantWithPets} />
    </>
  );
}
