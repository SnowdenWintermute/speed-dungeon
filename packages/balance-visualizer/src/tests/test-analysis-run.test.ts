import { DEFAULT_ANALYSIS_CHARACTER_SPECS } from "@/analysis-subjects/default-analysis-character-specs";
import { attackDamageAnalysisRun } from "@/studies/attack-damage/run";
import { maxAccuracyAnalysisRun } from "@/studies/max-accuracy/run";

const RUN_COUNT = 100;
// a full party walking every floor takes about 70ms, which does not fit the suite's global timeout
const TIMEOUT = 60000;

it(
  "runs a mock attack damage analysis run",
  () => {
    for (let i = 0; i < RUN_COUNT; i += 1) {
      expect(() => attackDamageAnalysisRun(DEFAULT_ANALYSIS_CHARACTER_SPECS)).not.toThrow();
    }
  },
  TIMEOUT
);

it(
  "runs a mock max accuracy analysis run",
  () => {
    for (let i = 0; i < RUN_COUNT; i += 1) {
      expect(() => maxAccuracyAnalysisRun(DEFAULT_ANALYSIS_CHARACTER_SPECS)).not.toThrow();
    }
  },
  TIMEOUT
);
