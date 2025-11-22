export enum HitOutcome {
  Miss,
  Evade,
  Parry,
  Counterattack,
  Resist,
  ShieldBlock,
  Hit,
  Death,
}

export const HIT_OUTCOME_NAME_STRINGS: Record<HitOutcome, string> = {
  [HitOutcome.Miss]: "Miss",
  [HitOutcome.Evade]: "Evade",
  [HitOutcome.Parry]: "Parry",
  [HitOutcome.Counterattack]: "Counterattack",
  [HitOutcome.Resist]: "Resist",
  [HitOutcome.ShieldBlock]: "ShieldBlock",
  [HitOutcome.Hit]: "Hit",
  [HitOutcome.Death]: "Death",
};
