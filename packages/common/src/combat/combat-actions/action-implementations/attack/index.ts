import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack-melee-main-hand.js";
import {
  Equipment,
  EquipmentSlotType,
  HoldableSlotType,
} from "../../../../items/equipment/index.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack-melee-off-hand.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";

const config: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => null,
  getHpChangeProperties: () => null, // client should display child hp change properties
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: function (context: ActionResolutionStepContext): CombatActionComponent[] {
    const toReturn: CombatActionComponent[] = [];
    const user = context.combatantContext.combatant.combatantProperties;
    const mainHandEquipmentOption = CombatantEquipment.getEquipmentInSlot(user, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });
    if (
      mainHandEquipmentOption &&
      !Equipment.isBroken(mainHandEquipmentOption) &&
      Equipment.isRangedWeapon(mainHandEquipmentOption)
    ) {
      toReturn.push(ATTACK_RANGED_MAIN_HAND);
    } else {
      toReturn.push(ATTACK_MELEE_MAIN_HAND);
      if (!ATTACK_MELEE_MAIN_HAND.requiresCombatTurn(context)) toReturn.push(ATTACK_MELEE_OFF_HAND);
      // const specialExtra = ATTACK_MELEE_MAIN_HAND;
      // if (specialExtra) toReturn.push(specialExtra);
    }
    return toReturn;
  },
  getParent: () => {
    console.log("tried to get parent for attack");
    return null;
  },
  getRequiredRange: function (
    user: CombatantProperties,
    self: CombatActionComponent
  ): CombatActionRequiredRange {
    // @TODO - determine based on children
    throw new Error("Function not implemented.");
  },
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    throw new Error("Function not implemented.");
  },
  getIsParryable() {
    throw new Error("Function not implemented.");
  },
  getCanTriggerCounterattack: (user: CombatantProperties) => {
    throw new Error("Function not implemented");
  },
  getIsBlockable: (user: CombatantProperties) => {
    throw new Error("Function not implemented");
  },
  getCritChance: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    throw new Error("Function not implemented.");
  },
  getResolutionSteps: () => [ActionResolutionStepType.DetermineChildActions],
  motionPhasePositionGetters: {},
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, config);
