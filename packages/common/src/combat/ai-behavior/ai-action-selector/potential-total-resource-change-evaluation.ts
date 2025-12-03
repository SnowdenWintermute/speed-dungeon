export interface ResourceChangeEvaluationWeights {
  avgPrimary: number;
  maxPrimary: number;
  avgTotal: number;
  maxTotal: number;
  efficiency: number;
  efficiencyBonusCap: number;
}

export interface ResourceChangeEfficiencyEvaluation {
  max: number;
  average: number;
  averageResourcePricePerPoint: number;
}

export class PotentialTotalResourceChangeEvaluation {
  onPrimaryTarget: null | ResourceChangeEfficiencyEvaluation = null;
  totalAcrossAllTargets: null | ResourceChangeEfficiencyEvaluation = null;

  constructor(private resourceCost: number) {}

  private static EPSILON = 0.0001;

  protected static STANDARD_RESOURCE_CHANGE_EVALUATION_WEIGHTS: ResourceChangeEvaluationWeights = {
    avgPrimary: 1.0,
    maxPrimary: 0.5,
    avgTotal: 0.8,
    maxTotal: 0.3,
    efficiency: 0.25,
    efficiencyBonusCap: 5,
  };

  setPrimaryTargetEfficiencyEvaluation(max: number, average: number) {
    // we want absolute values because this may be used for healing (positive numbers)
    // or damage (negative numbers)
    max = Math.abs(max);
    average = Math.abs(average);

    const averageResourcePricePerPoint =
      this.resourceCost / (average || PotentialTotalResourceChangeEvaluation.EPSILON);
    this.onPrimaryTarget = { max, average, averageResourcePricePerPoint };
  }

  setOrUpdateTotalAcrossAllTargets(max: number, average: number) {
    if (this.totalAcrossAllTargets === null) {
      this.totalAcrossAllTargets = { max: 0, average: 0, averageResourcePricePerPoint: 0 };
    }

    // we want absolute values because this may be used for healing (positive numbers)
    // or damage (negative numbers)
    this.totalAcrossAllTargets.average += Math.abs(average);
    this.totalAcrossAllTargets.max += Math.abs(max);
  }

  computeEfficiencyAcrossAllTargets() {
    if (!this.totalAcrossAllTargets) {
      return;
    }

    this.totalAcrossAllTargets.averageResourcePricePerPoint =
      this.resourceCost /
      (this.totalAcrossAllTargets.average || PotentialTotalResourceChangeEvaluation.EPSILON);
  }

  getEvaluations() {
    return { onPrimaryTarget: this.onPrimaryTarget, totalAcrossAllies: this.totalAcrossAllTargets };
  }

  getScore(
    weights: ResourceChangeEvaluationWeights = PotentialTotalResourceChangeEvaluation.STANDARD_RESOURCE_CHANGE_EVALUATION_WEIGHTS
  ) {
    const { onPrimaryTarget, totalAcrossAllTargets } = this;

    let score = 0;

    if (onPrimaryTarget) {
      score += weights.avgPrimary * onPrimaryTarget.average;
      score += weights.maxPrimary * onPrimaryTarget.max;
    }

    if (totalAcrossAllTargets) {
      score += weights.avgTotal * totalAcrossAllTargets.average;
      score += weights.maxTotal * totalAcrossAllTargets.max;
      if (totalAcrossAllTargets.averageResourcePricePerPoint) {
        score += weights.efficiency * (1 / totalAcrossAllTargets.averageResourcePricePerPoint);
      } else {
        score += weights.efficiency * weights.efficiencyBonusCap;
      }
    }

    return score;
  }
}
