import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";

// reachable from the workbook sync scripts, which node runs straight from source: relative imports
// on that path carry a .ts extension, because node resolves neither the @/ alias nor an
// extensionless specifier

/**
 * A study is a named party composition walked against an analysis, not the analysis alone — the
 * party's mix of specialties decides how loot gets allocated, so the same analysis run against a
 * different party is a different study with its own findings.
 */
export enum StudyName {
  MaxAccuracyMixed,
  AttackDamageMixed,
}

/** used for generated file names and as the study's label; the workbook holds the enum member name */
export const STUDY_NAME_SLUGS: Record<StudyName, string> = {
  [StudyName.MaxAccuracyMixed]: "max-accuracy-mixed",
  [StudyName.AttackDamageMixed]: "attack-damage-mixed",
};

/** kept apart from the party in study-configurations.ts, which node cannot load */
export const STUDY_ANALYSES: Record<StudyName, DungeonRunAnalysis> = {
  [StudyName.MaxAccuracyMixed]: DungeonRunAnalysis.MaxAccuracy,
  [StudyName.AttackDamageMixed]: DungeonRunAnalysis.AttackDamage,
};
