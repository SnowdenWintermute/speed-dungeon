import { NormalizedPercentage } from "../aliases.js";

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

export class SequentialNumberGenerator implements RandomNumberGenerator {
  private index = 0;
  constructor(private sequence: NormalizedPercentage[]) {}
  roll = (): NormalizedPercentage => {
    const value = this.sequence[this.index % this.sequence.length];
    if (value === undefined) {
      throw new Error("SequentialNumberGenerator has an empty sequence");
    }
    this.index += 1;
    return value;
  };
}
