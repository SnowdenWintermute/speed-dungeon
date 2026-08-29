import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  DEFAULT_ANALYSIS_CHARACTER_BUILDS,
  defaultAnalysisCharacterSpecs,
} from "../analysis-subjects/default-analysis-character-specs.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { StudyName } from "./study-name.ts";

export interface StudyConfiguration {
  characterSpecs: AnalysisCharacterSpecification[];
}

/**
 * The same builds the other studies walk, with the mage casting rather than swinging. Loot is
 * allocated to whoever a candidate improves most, so seating the caster beside two weapon users is
 * what makes the spirit it ends up with mean anything: it had to win those items against them.
 */
function casterDamageMixedCharacterSpecs() {
  return DEFAULT_ANALYSIS_CHARACTER_BUILDS.map(
    ({ name, build }) =>
      new AnalysisCharacterSpecification(
        name,
        build,
        build.mainClass === CombatantClass.Mage
          ? AnalysisGoal.IceBoltDamage
          : AnalysisGoal.WeaponAttackDamage
      )
  );
}

/** a Record so a study without a configuration is a compile error rather than a lookup miss */
export const STUDY_CONFIGURATIONS: Record<StudyName, StudyConfiguration> = {
  [StudyName.MaxAccuracyMixed]: {
    characterSpecs: defaultAnalysisCharacterSpecs(AnalysisGoal.TotalAccuracy),
  },
  [StudyName.AttackDamageMixed]: {
    characterSpecs: defaultAnalysisCharacterSpecs(AnalysisGoal.WeaponAttackDamage),
  },
  [StudyName.CasterDamageMixed]: {
    characterSpecs: casterDamageMixedCharacterSpecs(),
  },
};
