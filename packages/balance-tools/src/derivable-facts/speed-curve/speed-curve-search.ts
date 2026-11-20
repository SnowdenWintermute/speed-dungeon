import { SPEED_TIER_CONFIGS, SPEED_TIERS, SpeedTier } from "./speed-tier.ts";

export interface SpeedTierRoom {
  floor: number;
  room: number;
  level: number;
  slowAgility: number;
  agilityByTier: Record<SpeedTier, number>;
}

export interface SpeedCurveInputs {
  rooms: SpeedTierRoom[];
  slowestAgility: number;
  maxAttainableAgility: number;
}

export interface SpeedCurveFit {
  /** base speed divided by the agility to speed ratio: the base, counted in points of agility */
  agilityBase: number;
  exponent: number;
  maxAttainableToSlowestTurnRatio: number;
  /** squared log error summed over every room's tiers */
  error: number;
}

const AGILITY_BASE_SEARCH_MIN = 0.01;
const AGILITY_BASE_SEARCH_MAX = 10_000;
const AGILITY_BASE_SEARCH_STEPS = 4000;

/**
 * Turns are proportional to speed^exponent and speed is base + ratio × agility, so a turn ratio is
 * ((agilityBase + agility) / (agilityBase + slowAgility))^exponent. The base and the ratio only
 * ever appear divided, which leaves two knobs. For a given agility base the exponent with the least
 * squared log error has a closed form, so only the agility base is searched.
 */
export class SpeedCurveSearch {
  constructor(private inputs: SpeedCurveInputs) {}

  static turnRatio(agilityBase: number, exponent: number, agility: number, slowAgility: number) {
    return Math.pow((agilityBase + agility) / (agilityBase + slowAgility), exponent);
  }

  private fitAt(agilityBase: number): null | SpeedCurveFit {
    const pairs = this.inputs.rooms.flatMap((room) =>
      SPEED_TIERS.map((tier) => ({
        logRatio: Math.log(
          (agilityBase + room.agilityByTier[tier]) / (agilityBase + room.slowAgility)
        ),
        logTarget: Math.log(SPEED_TIER_CONFIGS[tier].targetTurnRatio),
      }))
    );

    let crossProductSum = 0;
    let squaredSum = 0;
    for (const { logRatio, logTarget } of pairs) {
      crossProductSum += logRatio * logTarget;
      squaredSum += logRatio * logRatio;
    }
    if (squaredSum === 0) {
      return null;
    }

    const { slowestAgility, maxAttainableAgility } = this.inputs;
    const logMaxRatio = Math.log(
      (agilityBase + maxAttainableAgility) / (agilityBase + slowestAgility)
    );
    const exponent = crossProductSum / squaredSum;
    if (exponent <= 0) {
      return null;
    }

    let error = 0;
    for (const { logRatio, logTarget } of pairs) {
      error += Math.pow(exponent * logRatio - logTarget, 2);
    }

    return {
      agilityBase,
      exponent,
      maxAttainableToSlowestTurnRatio: Math.exp(exponent * logMaxRatio),
      error,
    };
  }

  /** log spaced, since a base of 1 against 2 matters as much as one of 1000 against 2000 */
  computeBestFit() {
    let best: null | SpeedCurveFit = null;
    const logMin = Math.log(AGILITY_BASE_SEARCH_MIN);
    const logStep = (Math.log(AGILITY_BASE_SEARCH_MAX) - logMin) / AGILITY_BASE_SEARCH_STEPS;

    for (let step = 0; step <= AGILITY_BASE_SEARCH_STEPS; step++) {
      const fit = this.fitAt(Math.exp(logMin + step * logStep));
      if (fit !== null && (best === null || fit.error < best.error)) {
        best = fit;
      }
    }

    if (best === null) {
      throw new Error("no agility base gave the tiers any agility above the slow tier");
    }
    return best;
  }
}
