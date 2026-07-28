import React from "react";
import { GAME_MODE_STRINGS, RankedFloorClearView, formatDuration } from "@speed-dungeon/common";
import { LadderTableCellLayout, LadderTableColumn } from "../ladder-table/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { floorClearRoute, gameRecordRoute } from "../routes";
import { PlayerLinks } from "./PlayerLinks";

export const CUMULATIVE_CLEAR_TIMES_COLUMNS: LadderTableColumn<RankedFloorClearView>[] = [
  { header: "Rank", widthPercentOption: 8, renderCell: (entry) => entry.rank },
  { header: "Floor", widthPercentOption: 10, renderCell: (entry) => entry.floor },
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
    cellLayoutOption: LadderTableCellLayout.Stacked,
    renderCell: (entry) => <PlayerLinks players={entry.players} />,
  },
  { header: "Mode", renderCell: (entry) => GAME_MODE_STRINGS[entry.mode] },
  {
    // the time is what this row is a record of, so it is what leads to the clear's own page
    header: "Cumulative Time",
    renderCell: (entry) => (
      <LadderTableCellLink href={floorClearRoute(entry.id)}>
        {formatDuration(entry.cumulativeTimeToClearFloor)}
      </LadderTableCellLink>
    ),
  },
];
