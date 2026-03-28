import { Meters } from "../../../aliases.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";

export enum AutoTargetingScheme {
  UserSelected,
  CopyParent, // attack, chaining multiple swings on a target
  ActionUser, // life drain heal
  All, // all combatants
  RandomCombatant, //
  WithinRadiusOfEntity, //
}

// SELECTION METHODS
export interface AutoTargetSelectionMethodUserSelected {
  scheme: AutoTargetingScheme.UserSelected;
}

export interface AutoTargetSelectionMethodCopyParent {
  scheme: AutoTargetingScheme.CopyParent;
}

export interface AutoTargetSelectionMethodUser {
  scheme: AutoTargetingScheme.ActionUser;
}

export interface AutoTargetSelectionMethodAll {
  scheme: AutoTargetingScheme.All;
}

export interface AutoTargetSelectionMethodRandomCombatant {
  scheme: AutoTargetingScheme.RandomCombatant;
}

export interface AutoTargetSelectionMethodWithinRadiusOfEntity {
  scheme: AutoTargetingScheme.WithinRadiusOfEntity;
  radius: Meters;
  validTargetCategories: TargetCategories;
  excludePrimaryTarget?: boolean;
}

export type AutoTargetingSelectionMethod =
  | AutoTargetSelectionMethodUserSelected
  | AutoTargetSelectionMethodCopyParent
  | AutoTargetSelectionMethodUser
  | AutoTargetSelectionMethodAll
  | AutoTargetSelectionMethodRandomCombatant
  | AutoTargetSelectionMethodWithinRadiusOfEntity;
