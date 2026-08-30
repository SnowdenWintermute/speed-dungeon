import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  ALLOCATED_TOWARD_GOAL,
  AttributeSourceType,
} from "../analysis-subjects/attribute-source.ts";
import type { AttributeSource } from "../analysis-subjects/attribute-source.ts";
import {
  CASTER_DUAL_WIELD_RANGED_ANALYSIS_CHARACTER_BUILDS,
  DEFAULT_ANALYSIS_CHARACTER_BUILDS,
  defaultAnalysisCharacterSpecs,
} from "../analysis-subjects/default-analysis-character-specs.ts";
import type { NamedAnalysisCharacterBuild } from "../analysis-subjects/default-analysis-character-specs.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { StudyName } from "./study-name.ts";

export interface StudyConfiguration {
  characterSpecs: AnalysisCharacterSpecification[];
}

function goalOfMixedCasterParty(build: NamedAnalysisCharacterBuild["build"]) {
  return build.mainClass === CombatantClass.Mage
    ? AnalysisGoal.IceBoltDamage
    : AnalysisGoal.WeaponAttackDamage;
}

function mixedCasterCharacterSpecs(builds: NamedAnalysisCharacterBuild[]) {
  return builds.map(
    ({ name, build }) =>
      new AnalysisCharacterSpecification(
        name,
        build,
        goalOfMixedCasterParty(build),
        ALLOCATED_TOWARD_GOAL
      )
  );
}

/**
 * An armor character earns nothing of its own: it walks with the attributes the same build was worth
 * in the study that its armor's requirements were derived against, so what it can wear in a room is
 * what a real build could have worn there.
 */
function copiedFrom(
  studyName: StudyName,
  build: NamedAnalysisCharacterBuild["build"],
  goal: AnalysisGoal
): AttributeSource {
  return {
    type: AttributeSourceType.CopiedFromStudyTable,
    studyName,
    slice: {
      weaponSpecialty: build.weaponSpecialty,
      mainClass: build.mainClass,
      supportClass: build.supportClass,
      goal,
    },
    rooms: [],
  };
}

function armorClassCharacterSpecs(
  builds: NamedAnalysisCharacterBuild[],
  copySourceStudyOf: (build: NamedAnalysisCharacterBuild["build"]) => StudyName
) {
  return builds.map(
    ({ name, build }) =>
      new AnalysisCharacterSpecification(
        name,
        build,
        AnalysisGoal.ArmorClass,
        copiedFrom(copySourceStudyOf(build), build, goalOfMixedCasterParty(build))
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
    characterSpecs: mixedCasterCharacterSpecs(DEFAULT_ANALYSIS_CHARACTER_BUILDS),
  },
  [StudyName.CasterDualWieldRanged]: {
    characterSpecs: mixedCasterCharacterSpecs(CASTER_DUAL_WIELD_RANGED_ANALYSIS_CHARACTER_BUILDS),
  },

  // the caster copies from the study that measured it casting, since that is the run its cloth was
  // gated against; the two weapon users copy from the one that measured them swinging
  [StudyName.ArmorClassMixed]: {
    characterSpecs: armorClassCharacterSpecs(DEFAULT_ANALYSIS_CHARACTER_BUILDS, (build) =>
      build.mainClass === CombatantClass.Mage
        ? StudyName.CasterDamageMixed
        : StudyName.AttackDamageMixed
    ),
  },
  // the party the mixed study leaves out, so dual wield is measured too
  [StudyName.ArmorClassDualWield]: {
    characterSpecs: armorClassCharacterSpecs(
      CASTER_DUAL_WIELD_RANGED_ANALYSIS_CHARACTER_BUILDS,
      () => StudyName.CasterDualWieldRanged
    ),
  },
};
