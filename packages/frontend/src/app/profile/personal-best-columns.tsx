import React from "react";
import { FloorClearView, formatDuration } from "@speed-dungeon/common";
import { LadderTableColumn } from "../ladder/ladder-table/column";
import { LadderTableCellLink } from "../ladder/ladder-table/LadderTableCellLink";
import { floorClearRoute, gameRecordRoute } from "../ladder/routes";

// the mode and control scheme are the section's own selectors, so no column restates them, as on the
// floor clear board. what is left is one row per floor.
// both tables show both times, since the point of the pair is that they disagree. the two tables
// differ in which clears they hold, not in how a row reads, so the columns are the same for both.
// no rank column: rank belongs to a board, and which board a clear was ranked on would have to be
// said rather than assumed
export const PERSONAL_BEST_COLUMNS: LadderTableColumn<FloorClearView>[] = [
  { header: "Floor", widthPercentOption: 10, renderCell: (clear) => clear.floor },
  {
    header: "Party",
    renderCell: (clear) => (
      <LadderTableCellLink href={gameRecordRoute(clear.gameRecordId)}>
        {clear.partyName}
      </LadderTableCellLink>
    ),
  },
  {
    header: "Time On Floor",
    renderCell: (clear) => (
      <LadderTableCellLink href={floorClearRoute(clear.id)}>
        {formatDuration(clear.timeSpentOnFloor)}
      </LadderTableCellLink>
    ),
  },
  {
    header: "Cumulative Time",
    renderCell: (clear) => (
      <LadderTableCellLink href={floorClearRoute(clear.id)}>
        {formatDuration(clear.cumulativeTimeToClearFloor)}
      </LadderTableCellLink>
    ),
  },
];

export function personalBestKey(clear: FloorClearView): string {
  return clear.id;
}
