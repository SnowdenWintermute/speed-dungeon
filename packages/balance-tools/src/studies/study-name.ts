import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";

export enum StudyName {
  MaxAccuracyMixed,
  AttackDamageMixed,
  CasterDamageMixed,
  CasterDualWieldRanged,
}

/** used for generated file names and as the study's label; the workbook holds the enum member name */
export const STUDY_NAME_SLUGS: Record<StudyName, string> = {
  [StudyName.MaxAccuracyMixed]: "max-accuracy-mixed",
  [StudyName.AttackDamageMixed]: "attack-damage-mixed",
  [StudyName.CasterDamageMixed]: "caster-damage-mixed",
  [StudyName.CasterDualWieldRanged]: "caster-dual-ranged",
};

export const STUDY_ANALYSES = {
  [StudyName.MaxAccuracyMixed]: DungeonRunAnalysis.MaxAccuracy,
  [StudyName.AttackDamageMixed]: DungeonRunAnalysis.SampledDamage,
  [StudyName.CasterDualWieldRanged]: DungeonRunAnalysis.SampledDamage,
  // the same table as the attack damage study: sampled damage per room with the attributes behind
  // it. its party is what differs, seating a caster whose spirit the attack study never gates on
  [StudyName.CasterDamageMixed]: DungeonRunAnalysis.SampledDamage,
} as const satisfies Record<StudyName, DungeonRunAnalysis>;

// `as const` above so a panel can be parameterized by its study alone: this resolves which result
// type that study's table is constructed from, leaving nothing for a caller to get wrong
export type AnalysisOfStudy<TStudy extends StudyName> = (typeof STUDY_ANALYSES)[TStudy];
