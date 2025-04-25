import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import { AutoTargetingScheme, AutoTargetingSelectionMethod } from "../targeting/index.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";

export interface CombatActionTargetingProperties {
  targetingSchemes: TargetingScheme[];
  validTargetCategories: TargetCategories;
  autoTargetSelectionMethod: AutoTargetingSelectionMethod;
  prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];
  prohibitedHitCombatantStates: ProhibitedTargetCombatantStates[];
}

export enum TargetingPropertiesTypes {
  HostileSingle,
  HostileArea,
  HostileCopyParent,
  FriendlySingle,
}

const hostileSingle: CombatActionTargetingProperties = {
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  prohibitedTargetCombatantStates: [ProhibitedTargetCombatantStates.Dead],
  prohibitedHitCombatantStates: [],
};

export const GENERIC_TARGETING_PROPERTIES: Record<
  TargetingPropertiesTypes,
  CombatActionTargetingProperties
> = {
  [TargetingPropertiesTypes.HostileSingle]: hostileSingle,
  [TargetingPropertiesTypes.HostileArea]: {
    ...hostileSingle,
    targetingSchemes: [TargetingScheme.Area],
  },
  [TargetingPropertiesTypes.HostileCopyParent]: {
    ...hostileSingle,
    autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  },
  [TargetingPropertiesTypes.FriendlySingle]: {
    ...hostileSingle,
    validTargetCategories: TargetCategories.Friendly,
  },
};
