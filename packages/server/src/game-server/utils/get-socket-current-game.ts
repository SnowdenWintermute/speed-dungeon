import { GameServer } from "..";
import { SocketConnectionMetadata } from "../socket-connection-metadata";
import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function getSocketCurrentGame(this: GameServer,socketMeta: SocketConnectionMetadata ):Error | SpeedDungeonGame {
  const {currentGameName} = socketMeta
  if (currentGameName === null) return new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME)
    const gameOption = this.games.get(currentGameName);
  if (gameOption === undefined) return new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME)
    return gameOption
}
