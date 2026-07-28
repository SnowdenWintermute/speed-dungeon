import React from "react";
import { FloorClearSortField, FloorClearView, formatDuration } from "@speed-dungeon/common";
import { LadderTableColumn } from "../ladder/ladder-table/column";
import { LadderTableCellLink } from "../ladder/ladder-table/LadderTableCellLink";
import { floorClearRoute, gameRecordRoute } from "../ladder/routes";

// the mode and control scheme are the section's own selectors, so no column restates them, as on the
// floor clear board. what is left is one row per floor.
// both tables show both times, since the point of the pair is that they disagree; what changes is
// which one the table is a record of, and that is the one that links to the clear, as on the boards.
// no rank column: rank belongs to a board, and which board a clear was ranked on would have to be
// said rather than assumed
export function personalBestColumns(bestBy: FloorClearSortField): LadderTableColumn<FloorClearView>[] {
  function timeCell(field: FloorClearSortField, time: number, clearId: FloorClearView["id"]) {
    if (field !== bestBy) {
      return formatDuration(time);
    }
    return (
      <LadderTableCellLink href={floorClearRoute(clearId)}>
        {formatDuration(time)}
      </LadderTableCellLink>
    );
  }

  return [
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
      renderCell: (clear) =>
        timeCell(FloorClearSortField.TimeSpentOnFloor, clear.timeSpentOnFloor, clear.id),
    },
    {
      header: "Cumulative Time",
      renderCell: (clear) =>
        timeCell(
          FloorClearSortField.CumulativeTimeToClearFloor,
          clear.cumulativeTimeToClearFloor,
          clear.id
        ),
    },
  ];
}

export function personalBestKey(clear: FloorClearView): string {
  return clear.id;
}
