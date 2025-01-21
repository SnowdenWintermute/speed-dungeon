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

export const TARGET_CATEGORY_STRINGS: Record<TargetCategories, string> = {
  [TargetCategories.Opponent]: "Opponent",
  [TargetCategories.User]: "Self",
  [TargetCategories.Friendly]: "Teammate",
  [TargetCategories.Any]: "Any",
};
