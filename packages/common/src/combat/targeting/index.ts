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

export function formatTargetingScheme(targetingScheme: TargetingScheme): string {
  switch (targetingScheme) {
    case TargetingScheme.Single:
      return "Single";
    case TargetingScheme.Area:
      return "Area";
    case TargetingScheme.All:
      return "All";
  }
}

export enum TargetCategories {
  Opponent,
  User,
  Friendly,
  Any,
}

export function formatTargetCategories(category: TargetCategories): string {
  switch (category) {
    case TargetCategories.Opponent:
      return "Opponent";
    case TargetCategories.User:
      return "Self";
    case TargetCategories.Friendly:
      return "Teammate";
    case TargetCategories.Any:
      return "Any";
  }
}

export enum ProhibitedTargetCombatantStates {
  Dead,
  Alive,
}
