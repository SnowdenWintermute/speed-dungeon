import {
  ProhibitedTargetCombatantStates,
  TargetCategories,
  TargetingScheme,
} from "./targeting-schemes-and-categories.js";
import { CombatAttribute } from "../../combatants/combat-attributes.js";
import { WeaponSlot } from "../../items/equipment/slots.js";
import { NumberRange } from "../../primatives/number-range.js";
import { HpChangeSource } from "../hp-change-source-types.js";

export class CombatActionProperties {
  targetingSchemes: TargetingScheme[] = [TargetingScheme.Single];
  validTargetCategories: TargetCategories = TargetCategories.Opponent;
  usabilityContext: ActionUsableContext = ActionUsableContext.InCombat;
  prohibitedTargetCombatantStates: null | ProhibitedTargetCombatantStates[] = [
    ProhibitedTargetCombatantStates.Dead,
  ];
  requiresCombatTurn: boolean = true;
  hpChangeProperties: null | CombatActionHpChangeProperties = null;
  description: string = "";
  isMelee: boolean = true;
  accuracyPercentModifier: number = 100;
  constructor() {}
}

export enum ActionUsableContext {
  All,
  InCombat,
  OutOfCombat,
}

export const COMBAT_ACTION_USABLITY_CONTEXT_STRINGS: Record<ActionUsableContext, string> = {
  [ActionUsableContext.All]: "any time",
  [ActionUsableContext.InCombat]: "in combat",
  [ActionUsableContext.OutOfCombat]: "out of combat",
};

export class CombatActionHpChangeProperties {
  baseValues: NumberRange = new NumberRange(0, 0);
  finalDamagePercentMultiplier: number = 100;
  addWeaponDamageFromSlots: null | WeaponSlot[] = null;
  addWeaponHpChangeSourceCategoryFromSlot: null | WeaponSlot = null;
  addWeaponElementFromSlot: null | WeaponSlot = null;
  addWeaponKineticDamageTypeFromSlot: null | WeaponSlot = null;
  additiveAttributeAndPercentScalingFactor: null | [CombatAttribute, number] = null;
  critChanceAttribute: null | CombatAttribute = null;
  critChanceModifier: null | number = null;
  critMultiplierAttribute: null | CombatAttribute = null;
  constructor(public hpChangeSource: HpChangeSource) {}
}
