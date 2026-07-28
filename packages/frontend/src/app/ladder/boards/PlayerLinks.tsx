import React from "react";
import { Username } from "@speed-dungeon/common";
import { LadderTableCellLink } from "../ladder-table/LadderTableCellLink";
import { playerProfileRoute } from "../routes";

// flex-col is load-bearing for the links inside: it stretches each anchor to the cell width, which
// is what gives it a box to truncate. items-start would shrink-wrap them and stop the ellipsis
export function PlayerLinks({ players }: { players: Username[] }) {
  return (
    <div className="flex flex-col">
      {players.map((player) => (
        <LadderTableCellLink key={player} href={playerProfileRoute(player)}>
          {player}
        </LadderTableCellLink>
      ))}
    </div>
  );
}
