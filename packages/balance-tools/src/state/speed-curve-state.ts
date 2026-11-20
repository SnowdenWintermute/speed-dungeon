import { makeAutoObservable, observable, runInAction } from "mobx";
import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";
import { intensityPercent, SavedRun, savedRunFetchUrl } from "../analysis-runs/saved-run-paths.ts";
import { SpeedCurveInputsAssembler } from "../derivable-facts/speed-curve/speed-curve-inputs-assembler.ts";
import {
  SpeedCurveFit,
  SpeedCurveInputs,
  SpeedCurveSearch,
} from "../derivable-facts/speed-curve/speed-curve-search.ts";
import { SPEED_TIER_CONFIGS, SpeedTier } from "../derivable-facts/speed-curve/speed-tier.ts";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";

const SPEED_CURVE_STUDY = StudyName.MaxAgilityGroupThree;

export interface SpeedCurve {
  inputs: SpeedCurveInputs;
  fit: SpeedCurveFit;
}

export class SpeedCurveState {
  isComputing = false;
  failureReason: null | string = null;
  curve: null | SpeedCurve = null;

  constructor() {
    makeAutoObservable(this, { curve: observable.ref });
  }

  private static async fetchSamples(tier: SpeedTier) {
    const { intensity } = SPEED_TIER_CONFIGS[tier];
    const response = await fetch(savedRunFetchUrl(SPEED_CURVE_STUDY, intensity));
    if (!response.ok) {
      throw new Error(
        `no saved run for ${STUDY_NAME_SLUGS[SPEED_CURVE_STUDY]} at ${intensityPercent(intensity)}%`
      );
    }
    const saved: SavedRun<DungeonRunAnalysis.MaxSpeed> = await response.json();
    return saved.result.samples;
  }

  async compute() {
    this.isComputing = true;
    this.failureReason = null;

    try {
      const samplesByTier = {
        [SpeedTier.Average]: await SpeedCurveState.fetchSamples(SpeedTier.Average),
        [SpeedTier.Fast]: await SpeedCurveState.fetchSamples(SpeedTier.Fast),
        [SpeedTier.FullyAllocated]: await SpeedCurveState.fetchSamples(SpeedTier.FullyAllocated),
      };
      const inputs = new SpeedCurveInputsAssembler(samplesByTier).assemble();
      const fit = new SpeedCurveSearch(inputs).computeBestFit();
      runInAction(() => {
        this.curve = { inputs, fit };
      });
    } catch (probablyError) {
      runInAction(() => {
        this.failureReason =
          probablyError instanceof Error ? probablyError.message : String(probablyError);
      });
    } finally {
      runInAction(() => {
        this.isComputing = false;
      });
    }
  }
}
