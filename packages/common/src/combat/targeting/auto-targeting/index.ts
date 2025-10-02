import { Meters } from "../../../primatives/index.js";
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
export type AutoTargetSelectionMethodUserSelected = {
  scheme: AutoTargetingScheme.UserSelected;
};

export type AutoTargetSelectionMethodCopyParent = {
  scheme: AutoTargetingScheme.CopyParent;
};

export type AutoTargetSelectionMethodUser = {
  scheme: AutoTargetingScheme.ActionUser;
};

export type AutoTargetSelectionMethodAll = {
  scheme: AutoTargetingScheme.All;
};

export type AutoTargetSelectionMethodRandomCombatant = {
  scheme: AutoTargetingScheme.RandomCombatant;
};

export type AutoTargetSelectionMethodWithinRadiusOfEntity = {
  scheme: AutoTargetingScheme.WithinRadiusOfEntity;
  radius: Meters;
  validTargetCategories: TargetCategories;
  excludePrimaryTarget?: boolean;
};

export type AutoTargetingSelectionMethod =
  | AutoTargetSelectionMethodUserSelected
  | AutoTargetSelectionMethodCopyParent
  | AutoTargetSelectionMethodUser
  | AutoTargetSelectionMethodAll
  | AutoTargetSelectionMethodRandomCombatant
  | AutoTargetSelectionMethodWithinRadiusOfEntity;
