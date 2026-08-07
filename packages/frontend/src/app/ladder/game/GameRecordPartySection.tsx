import React from "react";
import { CombatantId, GameRecordPartyView } from "@speed-dungeon/common";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { RecordFactList } from "../detail-page/RecordFactList";
import { ladderCharacterColumns, ladderCharacterKey } from "../detail-page/character-columns";
import { partyFateAtTimeText } from "../party-fate-text";
import { gameRecordFloorClearColumns, gameRecordFloorClearKey } from "./floor-clear-columns";

// a party's characters carry no snapshot link of their own here — the snapshots hang off the clears
// below, one per character per clear
const PARTY_CHARACTER_COLUMNS = ladderCharacterColumns((character) => character.characterName);

export function GameRecordPartySection({ party }: { party: GameRecordPartyView }) {
  const characterNamesById = new Map<CombatantId, string>(
    party.characters.map((character) => [character.characterId, character.characterName])
  );

  return (
    <section className="mb-10">
      <h2 className="text-xl mb-2">{party.partyName}</h2>
      <RecordFactList
        facts={[
          { label: "Deepest Floor Reached", value: party.deepestFloorReached },
          { label: "Fate", value: partyFateAtTimeText(party.fateOption) },
        ]}
      />
      <h3 className="mb-2">Characters</h3>
      <DataTable
        columns={PARTY_CHARACTER_COLUMNS}
        entries={party.characters}
        keyOf={ladderCharacterKey}
        emptyMessage="No characters recorded for this party."
      />
      <h3 className="mt-6 mb-2">Floor Clears</h3>
      <DataTable
        columns={gameRecordFloorClearColumns(characterNamesById)}
        entries={party.floorClears}
        keyOf={gameRecordFloorClearKey}
        emptyMessage="This party cleared no floors."
      />
    </section>
  );
}
