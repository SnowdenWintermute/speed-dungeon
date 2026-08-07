import React from "react";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  FloorClearCharacter,
  FloorClearView,
  GAME_MODE_STRINGS,
  Username,
  formatDuration,
} from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { RecordFactList } from "../detail-page/RecordFactList";
import { LadderLink } from "../LadderLink";
import { PlayerProfileLinks } from "../detail-page/PlayerProfileLinks";
import { ladderCharacterColumns, ladderCharacterKey } from "../detail-page/character-columns";
import { characterSnapshotRoute, gameRecordRoute } from "../routes";

const FLOOR_CLEAR_CHARACTER_COLUMNS = ladderCharacterColumns<FloorClearCharacter<Username>>(
  (character) => {
    if (character.snapshotIdOption === undefined) {
      return character.characterName;
    }
    return (
      <LadderTableCellLink href={characterSnapshotRoute(character.snapshotIdOption)}>
        {character.characterName}
      </LadderTableCellLink>
    );
  }
);

export function FloorClearDetails({ floorClear }: { floorClear: FloorClearView }) {
  return (
    <>
      <h1 className="text-2xl mb-4">{`Floor ${floorClear.floor} Clear`}</h1>
      <RecordFactList
        facts={[
          {
            // the party name leads to the game record, as it does on the boards: a party is a thing
            // in a game, and the game record is where the rest of its run is
            label: "Party",
            value: (
              <LadderLink href={gameRecordRoute(floorClear.gameRecordId)}>
                {floorClear.partyName}
              </LadderLink>
            ),
          },
          { label: "Players", value: <PlayerProfileLinks players={floorClear.players} /> },
          { label: "Mode", value: GAME_MODE_STRINGS[floorClear.mode] },
          {
            label: "Control Scheme",
            value: CHARACTER_CONTROL_SCHEME_STRINGS[floorClear.controlScheme],
          },
          { label: "Time On Floor", value: formatDuration(floorClear.timeSpentOnFloor) },
          {
            label: "Cumulative Time",
            value: formatDuration(floorClear.cumulativeTimeToClearFloor),
          },
          { label: "Cleared At", value: formatTimestamp(floorClear.clearedAt) },
          { label: "Game Started", value: formatTimestamp(floorClear.gameStartedAt) },
        ]}
      />
      <h2 className="text-xl mb-2">Characters</h2>
      <DataTable
        columns={FLOOR_CLEAR_CHARACTER_COLUMNS}
        entries={floorClear.characters}
        keyOf={ladderCharacterKey}
        emptyMessage="No characters recorded for this clear."
      />
    </>
  );
}
