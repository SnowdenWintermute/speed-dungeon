import { NormalizedPercentage } from "../primatives/index.js";

export interface RandomNumberGenerator {
  roll: () => NormalizedPercentage;
}

// @PERF - find where we are creating these and replace with singletons
export class BasicRandomNumberGenerator implements RandomNumberGenerator {
  roll = (): NormalizedPercentage => Math.random();
}

export class FixedNumberGenerator implements RandomNumberGenerator {
  constructor(private alwaysRolls: NormalizedPercentage) {}
  roll = (): NormalizedPercentage => this.alwaysRolls;
}
