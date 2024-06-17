import { CombatAttribute } from "../../combatants/combat-attributes";
import { WeaponSlot } from "../../items/equipment/slots";
import { NumberRange } from "../../primatives/number-range";
import { HpChangeSource } from "../hp-change-source-types";
import { ProhibitedTargetCombatantStates, TargetCategories, TargetingScheme } from "../targeting";

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
  constructor() {}
}

export enum ActionUsableContext {
  All,
  InCombat,
  OutOfCombat,
}

export function formatActionUsabilityContext(actionUsabilityContext: ActionUsableContext): string {
  switch (actionUsabilityContext) {
    case ActionUsableContext.All:
      return "Any time";
    case ActionUsableContext.InCombat:
      return "In combat";
    case ActionUsableContext.OutOfCombat:
      return "Out of combat";
  }
}

export class CombatActionHpChangeProperties {
  baseValues: NumberRange = new NumberRange(0, 0);
  finalDamagePercentMultiplier: number = 100;
  accuracyPercentModifier: number = 100;
  addWeaponDamageFrom: null | WeaponSlot[] = null;
  addWeaponElementFrom: null | WeaponSlot = null;
  addWeaponDamageTypeFrom: null | WeaponSlot = null;
  additiveAttributeAndPercentScalingFactor: null | [CombatAttribute, number] = null;
  critChanceAttribute: null | CombatAttribute = null;
  critMultiplierAttribute: null | CombatAttribute = null;
  sourceProperties: HpChangeSource = new HpChangeSource();
  constructor() {}
}
