import { GameServer } from "../index.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function getSocketCurrentGame(
  this: GameServer,
  socketMeta: BrowserTabSession
): Error | SpeedDungeonGame {
  const { currentGameName } = socketMeta;
  if (currentGameName === null) return new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
  const gameOption = this.games.get(currentGameName);
  if (gameOption === undefined) return new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
  return gameOption;
}
