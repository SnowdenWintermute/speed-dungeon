export enum CombatActionIntent {
  Benevolent,
  Malicious,
}

export const COMBAT_ACTION_INTENT_STRINGS: Record<CombatActionIntent, string> = {
  [CombatActionIntent.Benevolent]: "Benevolent",
  [CombatActionIntent.Malicious]: "Malicious",
};
