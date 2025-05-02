export enum FriendOrFoe {
  Friendly,
  Hostile,
}

export enum TargetingScheme {
  Single,
  Area,
  All,
}

export const TARGETING_SCHEME_STRINGS: Record<TargetingScheme, string> = {
  [TargetingScheme.Single]: "Single",
  [TargetingScheme.Area]: "Area",
  [TargetingScheme.All]: "All",
};

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
