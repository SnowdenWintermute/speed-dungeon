import React from "react";
import {
  GAME_MODE_STRINGS,
  RankedFloorClearView,
  Username,
  formatDuration,
} from "@speed-dungeon/common";
import { LadderTableColumn } from "../ladder-table/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { floorClearRoute, playerProfileRoute } from "../routes";

export const CUMULATIVE_CLEAR_TIMES_COLUMNS: LadderTableColumn<RankedFloorClearView>[] = [
  { header: "Rank", widthPercentOption: 8, renderCell: (entry) => entry.rank },
  { header: "Floor", widthPercentOption: 10, renderCell: (entry) => entry.floor },
  {
    header: "Party",
    renderCell: (entry) => (
      <LadderTableCellLink href={floorClearRoute(entry.id)}>{entry.partyName}</LadderTableCellLink>
    ),
  },
  { header: "Players", renderCell: (entry) => <PlayerLinks players={entry.players} /> },
  { header: "Mode", renderCell: (entry) => GAME_MODE_STRINGS[entry.mode] },
  {
    header: "Cumulative Time",
    renderCell: (entry) => formatDuration(entry.cumulativeTimeToClearFloor),
  },
];

export function floorClearEntryKey(entry: RankedFloorClearView): string {
  return entry.id;
}

function PlayerLinks({ players }: { players: Username[] }) {
  return (
    <>
      {players.map((player, index) => (
        <React.Fragment key={player}>
          {index > 0 && ", "}
          <LadderTableCellLink href={playerProfileRoute(player)}>{player}</LadderTableCellLink>
        </React.Fragment>
      ))}
    </>
  );
}
