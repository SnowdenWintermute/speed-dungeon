export enum CombatantConditionName {
  PrimedForExplosion,
  PrimedForIceBurst,
  Burning,
  Blinded,
  FollowingPetCommand,
  Flying,
  Ensnared,
}

export const COMBATANT_CONDITION_NAME_STRINGS: Record<CombatantConditionName, string> = {
  [CombatantConditionName.PrimedForExplosion]: "Detonatable",
  [CombatantConditionName.PrimedForIceBurst]: "Shatterable",
  [CombatantConditionName.Burning]: "Burning",
  [CombatantConditionName.Blinded]: "Blinded",
  [CombatantConditionName.FollowingPetCommand]: "Following Command",
  [CombatantConditionName.Flying]: "Flying",
  [CombatantConditionName.Ensnared]: "Ensnared",
};
