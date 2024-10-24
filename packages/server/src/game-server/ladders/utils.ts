import { GameMessageType, ServerToClientEvent } from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";

export function notifyOnlinePlayersOfTopRankedDeaths(deathsAndRanks: {
  [combatantName: string]: {
    owner: string;
    rank: number;
    level: number;
  };
}) {
  for (const [characterName, deathAndRank] of Object.entries(deathsAndRanks)) {
    console.log(
      `${characterName} [${deathAndRank.owner}] died at level ${deathAndRank.level}, losing their position of rank ${deathAndRank.rank + 1} in the ladder`
    );
    getGameServer().io.emit(ServerToClientEvent.GameMessage, {
      type: GameMessageType.LadderDeath,
      characterName,
      playerName: deathAndRank.owner,
      level: deathAndRank.level,
      rank: deathAndRank.rank,
    });
  }
}

// update ladder when:
// - party wipes X
// - dead character disconnects X
// - character levels up X
// - character deleted X
// - character created X
// - server started X
