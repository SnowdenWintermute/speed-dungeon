import { IdGenerator } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";

export const idGenerator = new IdGenerator();

export const gameServer: { current: undefined | GameServer } = { current: undefined };

export function getGameServer() {
  if (!gameServer.current) throw new Error("GameServer is not initialized yet!");
  return gameServer.current;
}
