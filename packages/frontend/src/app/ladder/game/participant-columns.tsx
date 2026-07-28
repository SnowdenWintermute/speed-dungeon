import React from "react";
import { GameRecordParticipantView } from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";
import { LadderTableColumn } from "../ladder-table/column";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { playerProfileRoute } from "../routes";

// participants are the game's, not a party's — a player who abandoned is still one of the people
// this game happened to, which is the whole reason the record keeps them
export const GAME_RECORD_PARTICIPANT_COLUMNS: LadderTableColumn<GameRecordParticipantView>[] = [
  {
    header: "Player",
    renderCell: (participant) => (
      <LadderTableCellLink href={playerProfileRoute(participant.username)}>
        {participant.username}
      </LadderTableCellLink>
    ),
  },
  {
    header: "Abandoned",
    renderCell: (participant) =>
      participant.abandonedAtOption === undefined
        ? "—"
        : formatTimestamp(participant.abandonedAtOption),
  },
];

export function gameRecordParticipantKey(participant: GameRecordParticipantView): string {
  return participant.username;
}
