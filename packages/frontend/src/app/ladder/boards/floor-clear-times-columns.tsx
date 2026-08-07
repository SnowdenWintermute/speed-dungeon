import React from "react";
import {
  FloorClearSort,
  FloorClearSortField,
  RankedFloorClearView,
  formatDuration,
} from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { floorClearRoute, gameRecordRoute } from "../routes";
import { PlayerLinks } from "./PlayerLinks";

// the columns are a function rather than a const because two of them carry the board's sort state.
// the floor, mode and control scheme are the board's own filters, so no column restates them
export function floorClearTimesColumns(
  sort: FloorClearSort,
  onSort: (sort: FloorClearSort) => void
): DataTableColumn<RankedFloorClearView>[] {
  // a column already sorted flips direction; a new one starts ascending, since the fastest clear is
  // what a reader came for
  function sortOptionFor(field: FloorClearSortField) {
    const isSortedBy = sort.field === field;
    return {
      isSortedBy,
      isDescending: sort.isDescending,
      onSort: () => onSort({ field, isDescending: isSortedBy ? !sort.isDescending : false }),
    };
  }

  return [
    { header: "Rank", widthPercentOption: 8, renderCell: (entry) => entry.rank },
    {
      // the party is a thing in a game, not this one clear, so its name leads to the game record
      header: "Party",
      renderCell: (entry) => (
        <LadderTableCellLink href={gameRecordRoute(entry.gameRecordId)}>
          {entry.partyName}
        </LadderTableCellLink>
      ),
    },
    {
      header: "Players",
      cellLayoutOption: DataTableCellLayout.Stacked,
      renderCell: (entry) => <PlayerLinks players={entry.players} />,
    },
    {
      header: "Time On Floor",
      sortOption: sortOptionFor(FloorClearSortField.TimeSpentOnFloor),
      renderCell: (entry) => (
        <LadderTableCellLink href={floorClearRoute(entry.id)}>
          {formatDuration(entry.timeSpentOnFloor)}
        </LadderTableCellLink>
      ),
    },
    {
      header: "Cumulative Time",
      sortOption: sortOptionFor(FloorClearSortField.CumulativeTimeToClearFloor),
      renderCell: (entry) => (
        <LadderTableCellLink href={floorClearRoute(entry.id)}>
          {formatDuration(entry.cumulativeTimeToClearFloor)}
        </LadderTableCellLink>
      ),
    },
  ];
}
