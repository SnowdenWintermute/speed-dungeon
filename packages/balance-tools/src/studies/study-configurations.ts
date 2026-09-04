import { CombatantClass, NormalizedPercentage } from "@speed-dungeon/common";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import {
  DESIGNED_AGILITY_INVESTMENT_PERCENTAGE,
  DESIGNED_ARMOR_CLASS_ALLOCATION_PERCENTAGE,
  DESIGNED_OFFENSIVE_ALLOCATION_PERCENTAGE,
} from "../tuning-consts.ts";
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

/** what a study pins rather than leaves to the run controls, and what it opens them at */
export interface StudyRunControlPins {
  /** set by a study whose derivation only means anything at one intensity; absent lets the user pick */
  fixedAllocationIntensity?: NormalizedPercentage;
  defaultAllocationIntensity?: NormalizedPercentage;
  /** the share the study's goal is designed to be spent at, quoted beside whatever is dialed in */
  designedAllocationIntensity?: NormalizedPercentage;
  /** set by a study that is only itself with requirements handled one way; absent lets the user pick */
  fixedHonorsEquipmentRequirements?: boolean;
  /** set by a study whose goal never samples against a dummy, so the toggle would do nothing */
  fixedTargetDummiesHaveArmorClass?: boolean;
}

export interface StudyConfiguration {
  characterSpecs: AnalysisCharacterSpecification[];
  runControls: StudyRunControlPins;
}

const SAMPLED_DAMAGE_RUN_CONTROLS: StudyRunControlPins = {
  defaultAllocationIntensity: DESIGNED_OFFENSIVE_ALLOCATION_PERCENTAGE,
};

const ARMOR_CLASS_RUN_CONTROLS: StudyRunControlPins = {
  defaultAllocationIntensity: DESIGNED_ARMOR_CLASS_ALLOCATION_PERCENTAGE,
  fixedHonorsEquipmentRequirements: true,
  // this study scores the party's own armor class, never damage against a dummy
  fixedTargetDummiesHaveArmorClass: false,
};

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
    runControls: {
      // determinePerFloorMonsterEvasion applies the intended investment share itself, so the run it
      // reads has to be the unscaled ceiling. running under full intensity would discount twice
      fixedAllocationIntensity: FULL_ALLOCATION_INTENSITY,
      // a total accuracy read never touches a dummy, so arming one would only mislead
      fixedTargetDummiesHaveArmorClass: false,
    },
  },
  [StudyName.AttackDamageGroupOne]: {
    characterSpecs: defaultAnalysisCharacterSpecs(AnalysisGoal.WeaponAttackDamage),
    runControls: SAMPLED_DAMAGE_RUN_CONTROLS,
  },
  [StudyName.CasterDamageMixed]: {
    characterSpecs: mixedCasterCharacterSpecs(CHARACTER_BUILDS_GROUP_ONE),
    runControls: SAMPLED_DAMAGE_RUN_CONTROLS,
  },
  [StudyName.MixedDamageGroupThree]: {
    characterSpecs: mixedCasterCharacterSpecs(CHARACTER_BUILDS_GROUP_THREE),
    runControls: SAMPLED_DAMAGE_RUN_CONTROLS,
  },
  [StudyName.CasterDualWieldRanged]: {
    characterSpecs: mixedCasterCharacterSpecs(CHARACTER_BUILDS_GROUP_TWO),
    runControls: SAMPLED_DAMAGE_RUN_CONTROLS,
  },
  [StudyName.ArmorClassMixed]: {
    characterSpecs: armorClassCharacterSpecs(CHARACTER_BUILDS_GROUP_ONE, (build) =>
      build.mainClass === CombatantClass.Mage
        ? StudyName.CasterDamageMixed
        : StudyName.AttackDamageGroupOne
    ),
    runControls: ARMOR_CLASS_RUN_CONTROLS,
  },
  [StudyName.ArmorClassGroupThree]: {
    characterSpecs: armorClassCharacterSpecs(
      CHARACTER_BUILDS_GROUP_THREE,
      () => StudyName.MixedDamageGroupThree
    ),
    runControls: ARMOR_CLASS_RUN_CONTROLS,
  },
  [StudyName.MaxSpeedMixed]: {
    characterSpecs: defaultAnalysisCharacterSpecs(AnalysisGoal.TotalSpeed),
    runControls: {
      // the ceiling first: what the designed share is worth is read by dialing the intensity down
      // from it, so this study is the one that must not pin the slider
      defaultAllocationIntensity: FULL_ALLOCATION_INTENSITY,
      designedAllocationIntensity: DESIGNED_AGILITY_INVESTMENT_PERCENTAGE,
      // a speed read never touches a dummy, so arming one would only mislead
      fixedTargetDummiesHaveArmorClass: false,
    },
  },
};
