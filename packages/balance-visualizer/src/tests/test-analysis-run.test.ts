import { NormalizedPercentage } from "@speed-dungeon/common";
import { AllocationIntensity } from "@/analysis-runs/allocation-intensity";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-subjects/default-analysis-character-specs";
import { attackDamageAnalysisRun } from "@/studies/attack-damage/run";
import { maxAccuracyAnalysisRun } from "@/studies/max-accuracy/run";

const RUN_COUNT = 10;
// a full party walking every floor takes about 70ms, which does not fit the suite's global timeout
const TIMEOUT = 60000;
// a partial intensity as well as the whole, since the two walk different allocation and scaling paths
const INTENSITIES_TO_TRY: NormalizedPercentage[] = [1, 0.4];

it(
  "runs a mock attack damage analysis run",
  () => {
    for (const intensity of INTENSITIES_TO_TRY) {
      const allocationIntensity = new AllocationIntensity(intensity);
      for (let i = 0; i < RUN_COUNT; i += 1) {
        expect(() =>
          attackDamageAnalysisRun(DEFAULT_ANALYSIS_CHARACTER_SPECS, allocationIntensity)
        ).not.toThrow();
      }
    }
  },
  TIMEOUT
);

it(
  "runs a mock max accuracy analysis run",
  () => {
    for (const intensity of INTENSITIES_TO_TRY) {
      const allocationIntensity = new AllocationIntensity(intensity);
      for (let i = 0; i < RUN_COUNT; i += 1) {
        expect(() =>
          maxAccuracyAnalysisRun(DEFAULT_ANALYSIS_CHARACTER_SPECS, allocationIntensity)
        ).not.toThrow();
      }
    }
  },
  TIMEOUT
);
