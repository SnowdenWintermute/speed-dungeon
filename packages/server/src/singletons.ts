import { IdGenerator } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { collectAnimationLengths } from "./utils/collect-animation-lengths.js";

export const idGenerator = new IdGenerator();

export const gameServer: { current: undefined | GameServer } = { current: undefined };

export function getGameServer() {
  if (!gameServer.current) throw new Error("GameServer is not initialized yet!");
  return gameServer.current;
}

export const ANIMATION_LENGTHS = await collectAnimationLengths();

import { AverageRandomNumberGenerator, BasicRandomNumberGenerator } from "@speed-dungeon/common";

export const rngSingleton = new BasicRandomNumberGenerator();
export const averageRngSingleton = new AverageRandomNumberGenerator();
