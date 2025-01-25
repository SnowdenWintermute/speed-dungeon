import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
} from "../../../../combatants/index.js";
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
import { AutoTargetingScheme } from "../../../targeting/index.js";

const config: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  appliesConditions: [],
  incursDurabilityLoss: {},
  costBases: {},
  getResourceCosts: () => null,
  getExecutionTime: () => 0,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getAnimationsAndEffects: function (): void {
    // rely on children for this
    throw new Error("Function not implemented.");
  },
  getHpChangeProperties: () => null, // client should display child hp change properties
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: function (user: Combatant): CombatActionComponent[] | null {
    const toReturn: CombatActionComponent[] = [];
    const mainHandEquipmentOption = CombatantEquipment.getEquipmentInSlot(
      user.combatantProperties,
      { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand }
    );
    if (
      mainHandEquipmentOption &&
      !Equipment.isBroken(mainHandEquipmentOption) &&
      Equipment.isRangedWeapon(mainHandEquipmentOption)
    ) {
      toReturn.push(ATTACK_RANGED_MAIN_HAND);
    } else {
      toReturn.push(ATTACK_MELEE_MAIN_HAND);
      if (!ATTACK_MELEE_MAIN_HAND.requiresCombatTurn(user.combatantProperties)) {
        toReturn.push(ATTACK_MELEE_OFF_HAND);
      }
    }
    return toReturn;
  },
  getParent: () => null,
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
  getCritChance: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, config);
