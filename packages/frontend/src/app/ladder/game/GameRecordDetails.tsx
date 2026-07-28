import React from "react";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  GAME_MODE_STRINGS,
  GameRecordView,
} from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";
import { LadderTable } from "../ladder-table";
import { RecordFactList } from "../detail-page/RecordFactList";
import {
  GAME_RECORD_PARTICIPANT_COLUMNS,
  gameRecordParticipantKey,
} from "./participant-columns";
import { GameRecordPartySection } from "./GameRecordPartySection";

export function GameRecordDetails({ gameRecord }: { gameRecord: GameRecordView }) {
  return (
    <>
      <h1 className="text-2xl mb-4">{gameRecord.name}</h1>
      <RecordFactList
        facts={[
          { label: "Mode", value: GAME_MODE_STRINGS[gameRecord.mode] },
          {
            label: "Control Scheme",
            value: CHARACTER_CONTROL_SCHEME_STRINGS[gameRecord.controlScheme],
          },
          { label: "Started", value: formatTimestamp(gameRecord.timeStarted) },
        ]}
      />
      <h2 className="text-xl mb-2">Players</h2>
      <LadderTable
        columns={GAME_RECORD_PARTICIPANT_COLUMNS}
        entries={gameRecord.participants}
        keyOf={gameRecordParticipantKey}
        emptyMessage="No players recorded for this game."
      />
      <h2 className="text-xl mt-10 mb-4">Parties</h2>
      {gameRecord.parties.length === 0 && <p className="text-slate-400">No parties recorded.</p>}
      {gameRecord.parties.map((party) => (
        <GameRecordPartySection key={party.partyRecordId} party={party} />
      ))}
    </>
  );
}
