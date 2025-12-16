import { DEBUG_CONFIG, IdGenerator } from "@speed-dungeon/common";
import { GameServer } from "../game-server/index.js";
import { collectAnimationLengths } from "../utils/collect-animation-lengths.js";
import { collectBoundingBoxSizes } from "../utils/collect-bounding-box-sizes.js";

export const idGenerator = new IdGenerator({ saveHistory: DEBUG_CONFIG.SAVE_ID_GENERATOR_HISTORY });

export const gameServer: { current: undefined | GameServer } = { current: undefined };

export function getGameServer() {
  if (!gameServer.current) throw new Error("GameServer is not initialized yet!");
  return gameServer.current;
}

export const ANIMATION_LENGTHS = await collectAnimationLengths();
export const BOUNDING_BOX_SIZES = await collectBoundingBoxSizes();

import { FixedNumberGenerator, BasicRandomNumberGenerator } from "@speed-dungeon/common";

export const rngSingleton = new BasicRandomNumberGenerator();
export const averageRngSingleton = new FixedNumberGenerator(0.5);
