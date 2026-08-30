import {
  RandomNumberGenerationPolicyFactory,
  SeededNumberGenerator,
} from "@speed-dungeon/common";

/**
 * One roll stream shared by every goal that rolls, so a difference between two measurements
 * reflects the build change instead of the rolls, whatever the goals were measuring.
 */
export class ComparisonRollScope {
  private generator = SeededNumberGenerator.withRandomSeed();
  private policy = RandomNumberGenerationPolicyFactory.policyFromGenerator(this.generator);

  getGenerator() {
    return this.generator;
  }

  getPolicy() {
    return this.policy;
  }

  /**
   * Starts a scope within which every measurement draws the same numbers. Solvers compare against
   * baselines they took earlier in the scope, so it has to cover all of their measurements.
   */
  begin() {
    this.generator.setRandomSeed();
  }

  rewind() {
    this.generator.reset();
  }
}
