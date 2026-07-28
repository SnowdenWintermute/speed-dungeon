import React from "react";
import {
  CombatantId,
  GameRecordFloorClearView,
  formatDuration,
  invariant,
} from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";
import { LadderTableCellLayout, LadderTableColumn } from "../ladder-table/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { characterSnapshotRoute, floorClearRoute } from "../routes";

// the clears of one party, so no column restates the party or the game around them. the columns take
// the party's character names because a snapshot link names a character id and a reader wants a name
export function gameRecordFloorClearColumns(
  characterNamesById: Map<CombatantId, string>
): LadderTableColumn<GameRecordFloorClearView>[] {
  return [
    { header: "Floor", widthPercentOption: 10, renderCell: (clear) => clear.floor },
    {
      // the time on the floor is what a clear is a record of, so it is what leads to its own page,
      // as it does on the boards
      header: "Time On Floor",
      renderCell: (clear) => (
        <LadderTableCellLink href={floorClearRoute(clear.id)}>
          {formatDuration(clear.timeSpentOnFloor)}
        </LadderTableCellLink>
      ),
    },
    {
      header: "Cumulative Time",
      renderCell: (clear) => formatDuration(clear.cumulativeTimeToClearFloor),
    },
    { header: "Cleared At", renderCell: (clear) => formatTimestamp(clear.clearedAt) },
    {
      header: "Snapshots",
      cellLayoutOption: LadderTableCellLayout.Stacked,
      // flex-col as in PlayerLinks: it stretches each anchor to the cell width, which is what gives
      // it a box to truncate
      renderCell: (clear) => (
        <div className="flex flex-col">
          {clear.characterSnapshots.map((snapshot) => (
            <LadderTableCellLink
              key={snapshot.snapshotId}
              href={characterSnapshotRoute(snapshot.snapshotId)}
            >
              {characterNameOf(characterNamesById, snapshot.characterId)}
            </LadderTableCellLink>
          ))}
        </div>
      ),
    },
  ];
}

// a snapshot's character is one of the party's characters — the two lists come off the same party
// record — so a name missing here is our own projection disagreeing with itself rather than a
// character there is some other way to name
function characterNameOf(
  characterNamesById: Map<CombatantId, string>,
  characterId: CombatantId
): string {
  const nameOption = characterNamesById.get(characterId);
  invariant(nameOption !== undefined, `no character ${characterId} in this party`);
  return nameOption;
}

export function gameRecordFloorClearKey(clear: GameRecordFloorClearView): string {
  return clear.id;
}
