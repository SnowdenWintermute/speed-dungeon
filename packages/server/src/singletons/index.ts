import { DEBUG_CONFIG, IdGenerator } from "@speed-dungeon/common";
import { collectAnimationLengths } from "../utils/collect-animation-lengths.js";
import { collectBoundingBoxSizes } from "../utils/collect-bounding-box-sizes.js";

export const idGenerator = new IdGenerator({ saveHistory: DEBUG_CONFIG.SAVE_ID_GENERATOR_HISTORY });

export const ANIMATION_LENGTHS = await collectAnimationLengths();
export const BOUNDING_BOX_SIZES = await collectBoundingBoxSizes();

import { FixedNumberGenerator, BasicRandomNumberGenerator } from "@speed-dungeon/common";

export const rngSingleton = new BasicRandomNumberGenerator();
export const averageRngSingleton = new FixedNumberGenerator(0.5);
