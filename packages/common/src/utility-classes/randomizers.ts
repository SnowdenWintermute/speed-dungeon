import { NormalizedPercentage } from "../primatives/index.js";

export interface RandomNumberGenerator {
  roll: () => NormalizedPercentage;
}

// @PERF - find where we are creating these and replace with singletons
export class BasicRandomNumberGenerator implements RandomNumberGenerator {
  roll = (): NormalizedPercentage => Math.random();
}

export class AverageRandomNumberGenerator implements RandomNumberGenerator {
  roll = (): NormalizedPercentage => 0.5;
}
