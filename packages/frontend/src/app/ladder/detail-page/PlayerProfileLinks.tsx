import React from "react";
import { Username } from "@speed-dungeon/common";
import { LadderLink } from "../LadderLink";
import { playerProfileRoute } from "../routes";

// PlayerLinks' counterpart in a fact list: a roster read as one line rather than as a column, so the
// names sit inline and wrap together instead of each claiming a line of its own
export function PlayerProfileLinks({ players }: { players: Username[] }) {
  return (
    <span className="flex flex-wrap">
      {players.map((player) => (
        <span key={player} className="mr-4">
          <LadderLink href={playerProfileRoute(player)}>{player}</LadderLink>
        </span>
      ))}
    </span>
  );
}
