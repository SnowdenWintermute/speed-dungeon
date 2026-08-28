// kept apart from types.ts, which the workbook sync scripts cannot load: that module imports study
// samples through the @/ alias, and node resolves neither that nor an extensionless specifier

export enum DungeonRunAnalysis {
  MaxAccuracy,
  AttackDamage,
}
