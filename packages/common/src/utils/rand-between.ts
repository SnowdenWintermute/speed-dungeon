import { NormalizedPercentage } from "../aliases.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";

/** random number between two given numbers, inclusive */
export function randBetween(min: number, max: number, rng: RandomNumberGenerator) {
  // if we don't min with 1-epsilon we get bugs when roll is 1, causing a max damage of 6
  // to become 7
  const roll = Math.min(rng.roll(), 1 - Number.EPSILON);
  return min + Math.floor(roll * (max - min + 1));
}

export function rollNormalized(rng: RandomNumberGenerator): NormalizedPercentage {
  return rng.roll();
}
