import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";

/**
 * A study is a named party composition walked against an analysis, not the analysis alone — the
 * party's mix of specialties decides how loot gets allocated, so the same analysis run against a
 * different party is a different study with its own findings.
 */
export enum StudyName {
  MaxAccuracyMixed,
  AttackDamageMixed,
  CasterDamageMixed,
}

/** used for generated file names and as the study's label; the workbook holds the enum member name */
export const STUDY_NAME_SLUGS: Record<StudyName, string> = {
  [StudyName.MaxAccuracyMixed]: "max-accuracy-mixed",
  [StudyName.AttackDamageMixed]: "attack-damage-mixed",
  [StudyName.CasterDamageMixed]: "caster-damage-mixed",
};

export const STUDY_ANALYSES = {
  [StudyName.MaxAccuracyMixed]: DungeonRunAnalysis.MaxAccuracy,
  [StudyName.AttackDamageMixed]: DungeonRunAnalysis.SampledDamage,
  // the same table as the attack damage study: sampled damage per room with the attributes behind
  // it. its party is what differs, seating a caster whose spirit the attack study never gates on
  [StudyName.CasterDamageMixed]: DungeonRunAnalysis.SampledDamage,
} as const satisfies Record<StudyName, DungeonRunAnalysis>;

// `as const` above so a panel can be parameterized by its study alone: this resolves which result
// type that study's table is constructed from, leaving nothing for a caller to get wrong
export type AnalysisOfStudy<TStudy extends StudyName> = (typeof STUDY_ANALYSES)[TStudy];
