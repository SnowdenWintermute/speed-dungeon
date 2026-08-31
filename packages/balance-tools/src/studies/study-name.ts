import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";

export enum StudyName {
  MaxAccuracyMixed,
  AttackDamageGroupOne,
  CasterDamageMixed,
  MixedDamageGroupThree,
  CasterDualWieldRanged,
  ArmorClassMixed,
  ArmorClassGroupThree,
  MaxSpeedMixed,
}

/** used for generated file names and as the study's label; the workbook holds the enum member name */
export const STUDY_NAME_SLUGS: Record<StudyName, string> = {
  [StudyName.MaxAccuracyMixed]: "max-accuracy-mixed",
  [StudyName.AttackDamageGroupOne]: "attack-damage-group-one",
  [StudyName.CasterDamageMixed]: "caster-damage-mixed",
  [StudyName.MixedDamageGroupThree]: "mixed-damage-group-three",
  [StudyName.CasterDualWieldRanged]: "caster-dual-ranged",
  [StudyName.ArmorClassMixed]: "armor-class-mixed",
  [StudyName.ArmorClassGroupThree]: "armor-class-group-three",
  [StudyName.MaxSpeedMixed]: "max-speed-mixed",
};

export const STUDY_ANALYSES = {
  [StudyName.MaxAccuracyMixed]: DungeonRunAnalysis.MaxAccuracy,
  [StudyName.AttackDamageGroupOne]: DungeonRunAnalysis.SampledDamage,
  [StudyName.CasterDualWieldRanged]: DungeonRunAnalysis.SampledDamage,
  // the same table as the attack damage study: sampled damage per room with the attributes behind
  // it. its party is what differs, seating a caster whose spirit the attack study never gates on
  [StudyName.CasterDamageMixed]: DungeonRunAnalysis.SampledDamage,
  [StudyName.MixedDamageGroupThree]: DungeonRunAnalysis.SampledDamage,
  [StudyName.ArmorClassMixed]: DungeonRunAnalysis.ArmorClass,
  // one table, two parties: between them every weapon specialty is measured
  [StudyName.ArmorClassGroupThree]: DungeonRunAnalysis.ArmorClass,
  [StudyName.MaxSpeedMixed]: DungeonRunAnalysis.MaxSpeed,
} as const satisfies Record<StudyName, DungeonRunAnalysis>;

// `as const` above so a panel can be parameterized by its study alone: this resolves which result
// type that study's table is constructed from, leaving nothing for a caller to get wrong
export type AnalysisOfStudy<TStudy extends StudyName> = (typeof STUDY_ANALYSES)[TStudy];
