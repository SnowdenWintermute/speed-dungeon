import { GameMessageType, ServerToClientEvent } from "@speed-dungeon/common";
import { getGameServer } from "../../index.js";

export function notifyOnlinePlayersOfTopRankedDeaths(
  deathsAndRanks: {
    [combatantName: string]: {
      owner: string;
      rank: number;
      level: number;
    };
  },
  partyChannel: string
) {
  for (const [characterName, deathAndRank] of Object.entries(deathsAndRanks)) {
    getGameServer().io.except(partyChannel).emit(ServerToClientEvent.GameMessage, {
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
