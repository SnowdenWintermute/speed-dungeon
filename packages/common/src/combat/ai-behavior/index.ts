export enum AiType {
  Healer,
  TargetPetOwnerMostRecentTarget,
  TargetLowestHpEnemy,
  PrefersAttackWithMana,
  AlwaysPassTurn,
  RandomMaliciousAction,
  TargetTopOfThreatMeter,
}

export const AI_BEHAVIOR_TYPE_STRINGS: Record<AiType, string> = {
  [AiType.Healer]: "Healer",
  [AiType.TargetPetOwnerMostRecentTarget]: "TargetPetOwnerMostRecentTarget",
  [AiType.TargetLowestHpEnemy]: "TargetLowestHpEnemy",
  [AiType.PrefersAttackWithMana]: "PrefersAttackWithMana",
  [AiType.AlwaysPassTurn]: "AlwaysPassTurn",
  [AiType.RandomMaliciousAction]: "RandomMaliciousAction",
  [AiType.TargetTopOfThreatMeter]: "TargetTopOfThreatMeter",
};
