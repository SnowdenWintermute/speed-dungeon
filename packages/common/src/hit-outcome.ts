export enum HitOutcome {
  Miss,
  Evade,
  Parry,
  Counterattack,
  ShieldBlock,
  Hit,
}

export const HIT_OUTCOME_NAME_STRINGS: Record<HitOutcome, string> = {
  [HitOutcome.Miss]: "Miss",
  [HitOutcome.Evade]: "Evade",
  [HitOutcome.Parry]: "Parry",
  [HitOutcome.Counterattack]: "Counterattack",
  [HitOutcome.ShieldBlock]: "ShieldBlock",
  [HitOutcome.Hit]: "Hit",
};
