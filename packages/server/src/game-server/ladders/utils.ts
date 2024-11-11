import {
  GameMessage,
  GameMessageType,
  ServerToClientEvent,
  createLadderDeathsMessage,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export function notifyOnlinePlayersOfTopRankedDeaths(deathsAndRanks: {
  [combatantName: string]: {
    owner: string;
    rank: number;
    level: number;
  };
}) {
  for (const [characterName, deathAndRank] of Object.entries(deathsAndRanks)) {
    getGameServer().io.emit(
      ServerToClientEvent.GameMessage,
      new GameMessage(
        GameMessageType.LadderDeath,
        true,
        createLadderDeathsMessage(
          characterName,
          deathAndRank.owner,
          deathAndRank.level,
          deathAndRank.rank
        )
      )
    );
  }
}
