export * from "./copy-from-parent.js";
import { CombatantConditionName } from "../../../combatants/combatant-conditions/index.js";
import { FriendOrFoe } from "../../combat-actions/targeting-schemes-and-categories.js";

export enum AutoTargetingScheme {
  UserSelected,
  CopyParent, // attack, chaining multiple swings on a target
  ActionUser, // life drain heal
  BattleGroup, // all allies, all enemies
  RandomInGroup, // random ally/enemy
  All, // all combatants
  RandomCombatant, //
  SpecificSide, // main hand / offhand slash
  RandomSide,
  AllCombatantsWithCondition, //
  ClosestCombatantWithCondition, // lightning rod causes arcs from nearby targets to hit them
  CombatantWithHighestLevelCondition, // shrapnel explosion hitting combatant with highest level "magnet" condition
}

export enum SideTargetingType {
  ClosestValid,
  AdjacentOnly,
}

export enum Side {
  Left,
  Right,
}

export interface TargetableSide {
  side: Side;
  sideTargetingType: SideTargetingType;
}

// SELECTION METHODS
export type AutoTargetSelectionMethodUserSelected = {
  scheme: AutoTargetingScheme.UserSelected;
};

export type AutoTargetSelectionMethodSpecificSide = {
  scheme: AutoTargetingScheme.SpecificSide;
  side: TargetableSide;
};

export type AutoTargetSelectionMethodRandomSide = {
  scheme: AutoTargetingScheme.RandomSide;
};

export type AutoTargetSelectionMethodCopyParent = {
  scheme: AutoTargetingScheme.CopyParent;
};

export type AutoTargetSelectionMethodUser = {
  scheme: AutoTargetingScheme.ActionUser;
};

export type AutoTargetSelectionMethodBattleGroup = {
  scheme: AutoTargetingScheme.BattleGroup;
  friendOrFoe: FriendOrFoe;
};

export type AutoTargetSelectionMethodRandomCombatantInGroup = {
  scheme: AutoTargetingScheme.RandomInGroup;
  friendOrFoe: FriendOrFoe;
};

export type AutoTargetSelectionMethodAll = {
  scheme: AutoTargetingScheme.All;
};

export type AutoTargetSelectionMethodRandomCombatant = {
  scheme: AutoTargetingScheme.RandomCombatant;
};

export type AutoTargetSelectionMethodAllWithCondition = {
  scheme: AutoTargetingScheme.AllCombatantsWithCondition;
  conditionName: CombatantConditionName;
};

export type AutoTargetSelectionMethodClosestWithCondition = {
  scheme: AutoTargetingScheme.ClosestCombatantWithCondition;
  conditionName: CombatantConditionName;
};

export type AutoTargetSelectionMethodCombatantWithHighestLevelCondition = {
  scheme: AutoTargetingScheme.CombatantWithHighestLevelCondition;
  conditionName: CombatantConditionName;
};

export type AutoTargetingSelectionMethod =
  | AutoTargetSelectionMethodUserSelected
  | AutoTargetSelectionMethodSpecificSide
  | AutoTargetSelectionMethodRandomSide
  | AutoTargetSelectionMethodCopyParent
  | AutoTargetSelectionMethodUser
  | AutoTargetSelectionMethodBattleGroup
  | AutoTargetSelectionMethodRandomCombatantInGroup
  | AutoTargetSelectionMethodAll
  | AutoTargetSelectionMethodRandomCombatant
  | AutoTargetSelectionMethodAllWithCondition
  | AutoTargetSelectionMethodClosestWithCondition
  | AutoTargetSelectionMethodCombatantWithHighestLevelCondition;