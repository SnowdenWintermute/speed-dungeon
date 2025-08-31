import { RandomNumberGenerator } from "../utility-classes/randomizers.js";

/** random number between two given numbers, inclusive */
export function randBetween(min: number, max: number, rng: RandomNumberGenerator) {
  return Math.floor(rng.roll() * (max - min + 1) + min);
}
