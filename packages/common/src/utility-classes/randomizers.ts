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

// averages `rollCount` rolls of a base generator (a Bates sample) so results cluster
// toward 0.5 on a bell curve. higher rollCount = tighter clustering.

export class NormalDistributionNumberGenerator implements RandomNumberGenerator {
  constructor(
    private baseGenerator: RandomNumberGenerator,
    private rollCount: number
  ) {
    if (rollCount < 1) {
      throw new Error("NormalDistributionNumberGenerator requires a rollCount of at least 1");
    }
  }
  roll = (): NormalizedPercentage => {
    let sum = 0;
    for (let i = 0; i < this.rollCount; i += 1) sum += this.baseGenerator.roll();
    return sum / this.rollCount;
  };
}
