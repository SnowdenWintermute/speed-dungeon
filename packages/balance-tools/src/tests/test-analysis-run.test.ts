import { CombatAttribute, DEEPEST_FLOOR, NormalizedPercentage } from "@speed-dungeon/common";
import { AllocationIntensity } from "../analysis-runs/allocation-intensity.ts";
import { defaultAnalysisCharacterSpecs } from "../analysis-subjects/default-analysis-character-specs.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { STUDY_CONFIGURATIONS } from "../studies/study-configurations.ts";
import { StudyName } from "../studies/study-name.ts";
import { sampledDamageAnalysisRun } from "../studies/sampled-damage/run.ts";
import { maxAccuracyAnalysisRun } from "../studies/max-accuracy/run.ts";
import { armorClassAnalysisRun } from "../studies/armor-class/run.ts";

const RUN_COUNT = 10;
// a full party walking every floor takes about 70ms, which does not fit the suite's global timeout
const TIMEOUT = 60000;
// a partial intensity as well as the whole, since the two walk different allocation and scaling paths
const INTENSITIES_TO_TRY: NormalizedPercentage[] = [1, 0.4];
// both, since honoring requirements is what a solver hits when an item it wants is out of reach
const REQUIREMENT_HANDLING_TO_TRY = [
  { honorsEquipmentRequirements: false },
  { honorsEquipmentRequirements: true },
];

// the goals are per character, so this is the run where the solvers have to allocate and hand out
// loot against two different notions of "better" at once
it(
  "runs a mock analysis run whose party chases more than one goal",
  () => {
    const { characterSpecs } = STUDY_CONFIGURATIONS[StudyName.CasterDamageMixed];
    for (const intensity of INTENSITIES_TO_TRY) {
      const allocationIntensity = new AllocationIntensity(intensity);
      for (const options of REQUIREMENT_HANDLING_TO_TRY) {
        for (let i = 0; i < RUN_COUNT; i += 1) {
          expect(() =>
            sampledDamageAnalysisRun(characterSpecs, allocationIntensity, options)
          ).not.toThrow();
        }
      }
    }
  },
  TIMEOUT
);

it(
  "runs a mock attack damage analysis run",
  () => {
    for (const intensity of INTENSITIES_TO_TRY) {
      const allocationIntensity = new AllocationIntensity(intensity);
      for (const options of REQUIREMENT_HANDLING_TO_TRY) {
        for (let i = 0; i < RUN_COUNT; i += 1) {
          expect(() =>
            sampledDamageAnalysisRun(
              defaultAnalysisCharacterSpecs(AnalysisGoal.WeaponAttackDamage),
              allocationIntensity,
              options
            )
          ).not.toThrow();
        }
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
      for (const options of REQUIREMENT_HANDLING_TO_TRY) {
        for (let i = 0; i < RUN_COUNT; i += 1) {
          expect(() =>
            maxAccuracyAnalysisRun(
              defaultAnalysisCharacterSpecs(AnalysisGoal.TotalAccuracy),
              allocationIntensity,
              options
            )
          ).not.toThrow();
        }
      }
    }
  },
  TIMEOUT
);

it(
  "runs a mock armor class analysis run, whose party copies its attributes rather than earning them",
  () => {
    const { characterSpecs } = STUDY_CONFIGURATIONS[StudyName.ArmorClassMixed];
    const withProfiles = characterSpecs.map((spec) =>
      spec.withCopiedProfileRooms(mockCopiedProfileRooms())
    );

    for (const intensity of INTENSITIES_TO_TRY) {
      const allocationIntensity = new AllocationIntensity(intensity);
      for (const options of REQUIREMENT_HANDLING_TO_TRY) {
        for (let i = 0; i < RUN_COUNT; i += 1) {
          expect(() =>
            armorClassAnalysisRun(withProfiles, allocationIntensity, options)
          ).not.toThrow();
        }
      }
    }
  },
  TIMEOUT
);

/** one row per floor, climbing, so the run's later rooms exercise the fall back to a floor's last */
function mockCopiedProfileRooms() {
  const rooms = [];
  for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
    rooms.push({
      floor,
      room: 1,
      attributes: {
        [CombatAttribute.Strength]: floor * 5,
        [CombatAttribute.Dexterity]: floor * 5,
        [CombatAttribute.Spirit]: floor * 5,
      },
    });
  }
  return rooms;
}
