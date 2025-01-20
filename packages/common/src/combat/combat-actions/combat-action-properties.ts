import {
  ProhibitedTargetCombatantStates,
  TargetCategories,
  TargetingScheme,
} from "./targeting-schemes-and-categories.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { NumberRange } from "../../primatives/number-range.js";
import { HpChangeSource, HpChangeSourceModifiers } from "../hp-change-source-types.js";
import { CombatAttribute } from "../../attributes/index.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { Battle } from "../../battle/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionType } from "../index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { ConsumableType } from "../../items/consumables/index.js";

export enum DurabilityLossCondition {
  OnHit,
  OnUse,
}

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
  incursDurabilityLoss?: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  constructor() {}

  combatantIsValidTarget(
    actionUser: Combatant,
    potentialTarget: Combatant,
    battleOption: null | Battle
  ) {
    // check if in a valid target category for this action type
    const combatantIsInValidCategory = this.combatantIsInValidTargetCategory(
      actionUser,
      potentialTarget,
      battleOption
    );
    if (!combatantIsInValidCategory) return false;

    // valid targets must not be in a prohibited combatant state such as "dead" or "untargetable by spells"
    const combatantIsInProhibitedState = this.combatantIsInProhibitedTargetState(potentialTarget);
    if (combatantIsInProhibitedState) return false;

    return true;
  }

  combatantIsInValidTargetCategory(
    actionUser: Combatant,
    potentialTarget: Combatant,
    battleOption: null | Battle
  ) {
    const { validTargetCategories } = this;
    if (validTargetCategories === TargetCategories.Any) return true;

    const targetId = potentialTarget.entityProperties.id;
    const userId = actionUser.entityProperties.id;

    if (validTargetCategories === TargetCategories.User && !(targetId === userId)) return false;

    const targetIsAlly =
      !battleOption || Battle.combatantsAreAllies(actionUser, potentialTarget, battleOption);

    if (validTargetCategories === TargetCategories.Opponent && targetIsAlly) return false;
    if (validTargetCategories === TargetCategories.Friendly && !targetIsAlly) return false;
    return true;
  }

  combatantIsInProhibitedTargetState(potentialTarget: Combatant) {
    if (this.prohibitedTargetCombatantStates === null) return false;
    for (const prohibitedState of this.prohibitedTargetCombatantStates) {
      if (PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS[prohibitedState](this, potentialTarget))
        return true;
    }
    return false;
  }
}

const PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS: Record<
  ProhibitedTargetCombatantStates,
  (actionProperties: CombatActionProperties, combatant: Combatant) => boolean
> = {
  [ProhibitedTargetCombatantStates.Dead]: function (
    _actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return combatant.combatantProperties.hitPoints <= 0;
  },
  [ProhibitedTargetCombatantStates.Alive]: function (
    _actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return combatant.combatantProperties.hitPoints > 0;
  },
  [ProhibitedTargetCombatantStates.UntargetableByMagic]: function (
    actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return false;
  },
  [ProhibitedTargetCombatantStates.UntargetableByPhysical]: function (
    actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return false;
  },
};

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
  addWeaponDamageFromSlots: null | HoldableSlotType[] = null;
  addWeaponModifiersFromSlot: null | {
    slot: HoldableSlotType;
    modifiers: Set<HpChangeSourceModifiers>;
  } = null;
  additiveAttributeAndPercentScalingFactor: null | [CombatAttribute, number] = null;
  critChanceAttribute: null | CombatAttribute = null;
  critChanceModifier: null | number = null;
  critMultiplierAttribute: null | CombatAttribute = null;
  constructor(public hpChangeSource: HpChangeSource) {}
}
