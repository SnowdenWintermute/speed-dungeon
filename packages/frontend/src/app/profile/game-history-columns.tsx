import React from "react";
import { UserGameHistoryEntry } from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";
import { LadderTableColumn } from "../ladder/ladder-table/column";
import { LadderTableCellLink } from "../ladder/ladder-table/LadderTableCellLink";
import { gameRecordRoute } from "../ladder/routes";
import { partyFateText } from "../ladder/party-fate-text";
import { optionalTimestampText } from "../ladder/display-text";

// the fate and the abandonment are this player's own, not the viewer's — a history row is one game
// as it went for the person whose profile this is
export const GAME_HISTORY_COLUMNS: LadderTableColumn<UserGameHistoryEntry>[] = [
  {
    header: "Game",
    renderCell: (entry) => (
      <LadderTableCellLink href={gameRecordRoute(entry.gameId)}>
        {entry.gameName}
      </LadderTableCellLink>
    ),
  },
  { header: "Date", renderCell: (entry) => formatTimestamp(entry.date) },
  { header: "Fate", renderCell: (entry) => partyFateText(entry.partyFateOption) },
  { header: "Abandoned", renderCell: (entry) => optionalTimestampText(entry.abandonedAtOption) },
];

export function gameHistoryEntryKey(entry: UserGameHistoryEntry): string {
  return entry.gameId;
}
