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

const MULBERRY32_STATE_INCREMENT = 0x6d2b79f5;
// divides the unsigned 32 bit output down into [0, 1)
const UINT32_RANGE = 2 ** 32;

// mulberry32. `reset` replays the current seed's sequence from the start, so two measurements
// taken around a change can be made to draw identical numbers. `setSeed` moves to a different
// sequence, so repeated comparisons aren't all fit to the same one
export class SeededNumberGenerator implements RandomNumberGenerator {
  private state: number;
  constructor(private seed: number) {
    this.state = seed;
  }
  private static randomSeed() {
    return Math.floor(Math.random() * UINT32_RANGE);
  }
  static withRandomSeed() {
    return new SeededNumberGenerator(SeededNumberGenerator.randomSeed());
  }
  setRandomSeed = () => {
    this.setSeed(SeededNumberGenerator.randomSeed());
  };
  setSeed = (seed: number) => {
    this.seed = seed;
    this.state = seed;
  };
  reset = () => {
    this.state = this.seed;
  };
  roll = (): NormalizedPercentage => {
    this.state = (this.state + MULBERRY32_STATE_INCREMENT) | 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
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
