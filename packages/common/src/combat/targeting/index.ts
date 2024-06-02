export * from "./assign-character-action-targets";
export * from "./cycle-character-targeting-schemes";

export enum FriendOrFoe {
  Friendly,
  Hostile,
}

export enum TargetingScheme {
  Single,
  Area,
  All,
}

export enum TargetCategories {
  Opponent,
  User,
  Friendly,
  Any,
}

export enum ProhibitedTargetCombatantStates {
  Dead,
  Alive,
}
