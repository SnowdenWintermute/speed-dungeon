import { NormalizedPercentage } from "@speed-dungeon/common";
import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-subjects/default-analysis-character-specs";
import { attackDamageAnalysisRun } from "@/studies/attack-damage/run";
import { maxAccuracyAnalysisRun } from "@/studies/max-accuracy/run";

const RUN_COUNT = 10;
// a full party walking every floor takes about 70ms, which does not fit the suite's global timeout
const TIMEOUT = 60000;
// a partial share as well as the whole, since the two walk different allocation and scaling paths
const SHARES_TO_TRY = [1, 0.4] as NormalizedPercentage[];

it(
  "runs a mock attack damage analysis run",
  () => {
    for (const share of SHARES_TO_TRY) {
      for (let i = 0; i < RUN_COUNT; i += 1) {
        expect(() => attackDamageAnalysisRun(DEFAULT_ANALYSIS_CHARACTER_SPECS, share)).not.toThrow();
      }
    }
  },
  TIMEOUT
);

it(
  "runs a mock max accuracy analysis run",
  () => {
    for (const share of SHARES_TO_TRY) {
      for (let i = 0; i < RUN_COUNT; i += 1) {
        expect(() => maxAccuracyAnalysisRun(DEFAULT_ANALYSIS_CHARACTER_SPECS, share)).not.toThrow();
      }
    }
  },
  TIMEOUT
);
