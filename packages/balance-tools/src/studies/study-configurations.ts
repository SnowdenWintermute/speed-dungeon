import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  CASTER_DUAL_WIELD_RANGED_ANALYSIS_CHARACTER_BUILDS,
  DEFAULT_ANALYSIS_CHARACTER_BUILDS,
  defaultAnalysisCharacterSpecs,
} from "../analysis-subjects/default-analysis-character-specs.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { StudyName } from "./study-name.ts";

export interface StudyConfiguration {
  characterSpecs: AnalysisCharacterSpecification[];
}

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

function casterDualWieldRangedCharacterSpecs() {
  return CASTER_DUAL_WIELD_RANGED_ANALYSIS_CHARACTER_BUILDS.map(
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
  [StudyName.CasterDualWieldRanged]: {
    characterSpecs: casterDualWieldRangedCharacterSpecs(),
  },
};
