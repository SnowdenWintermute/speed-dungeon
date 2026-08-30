import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  ALLOCATED_TOWARD_GOAL,
  AttributeSourceType,
} from "../analysis-subjects/attribute-source.ts";
import type { AttributeSource } from "../analysis-subjects/attribute-source.ts";
import {
  ANALYSIS_CHARACTER_BUILDS,
  CHARACTER_BUILDS_GROUP_ONE,
  CHARACTER_BUILDS_GROUP_THREE,
  CHARACTER_BUILDS_GROUP_TWO,
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
  [StudyName.AttackDamageGroupOne]: {
    characterSpecs: defaultAnalysisCharacterSpecs(AnalysisGoal.WeaponAttackDamage),
  },
  [StudyName.CasterDamageMixed]: {
    characterSpecs: mixedCasterCharacterSpecs(CHARACTER_BUILDS_GROUP_ONE),
  },
  [StudyName.MixedDamageGroupThree]: {
    characterSpecs: mixedCasterCharacterSpecs(CHARACTER_BUILDS_GROUP_THREE),
  },
  [StudyName.CasterDualWieldRanged]: {
    characterSpecs: mixedCasterCharacterSpecs(CHARACTER_BUILDS_GROUP_TWO),
  },
  [StudyName.ArmorClassMixed]: {
    characterSpecs: armorClassCharacterSpecs(CHARACTER_BUILDS_GROUP_ONE, (build) =>
      build.mainClass === CombatantClass.Mage
        ? StudyName.CasterDamageMixed
        : StudyName.AttackDamageGroupOne
    ),
  },
  [StudyName.ArmorClassGroupThree]: {
    characterSpecs: armorClassCharacterSpecs(
      CHARACTER_BUILDS_GROUP_THREE,
      () => StudyName.MixedDamageGroupThree
    ),
  },
};
