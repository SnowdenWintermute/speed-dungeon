import cloneDeep from "lodash.clonedeep";
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

const hostileArea = cloneDeep(hostileSingle);
hostileArea.targetingSchemes = [TargetingScheme.Area];

const friendlySingle = cloneDeep(hostileSingle);
friendlySingle.validTargetCategories = TargetCategories.Friendly;

const hostileCopyParent = cloneDeep(hostileSingle);
hostileCopyParent.autoTargetSelectionMethod = { scheme: AutoTargetingScheme.CopyParent };

export const GENERIC_TARGETING_PROPERTIES: Record<
  TargetingPropertiesTypes,
  CombatActionTargetingProperties
> = {
  [TargetingPropertiesTypes.HostileSingle]: hostileSingle,
  [TargetingPropertiesTypes.HostileArea]: hostileArea,
  [TargetingPropertiesTypes.HostileCopyParent]: hostileCopyParent,
  [TargetingPropertiesTypes.FriendlySingle]: friendlySingle,
};
