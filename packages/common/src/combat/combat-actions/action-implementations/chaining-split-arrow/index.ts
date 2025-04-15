import {
  ActionPayableResource,
  ActionResourceCosts,
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { COMMON_ROOT_ACTION_STEPS_SEQUENCE } from "../common-action-steps-sequence.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Fire arrows which each bounce to up to two additional targets",
  targetingSchemes: [TargetingScheme.Area],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseResourceChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: { [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: 1 } },
  costBases: {},
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: () => {
    const costs: ActionResourceCosts = {
      [ActionPayableResource.Mana]: 1,
    };
    return costs;
  },
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getHpChangeProperties: () => null,
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    return [];
  },
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return combatantContext
      .getOpponents()
      .filter((opponent) => opponent.combatantProperties.hitPoints > 0)
      .map(
        (opponent) =>
          new CombatActionExecutionIntent(CombatActionName.ChainingSplitArrowProjectile, {
            type: CombatActionTargetType.Single,
            targetId: opponent.entityProperties.id,
          })
      );
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
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    throw new Error("Function not implemented.");
  },
  getResolutionSteps: () => COMMON_ROOT_ACTION_STEPS_SEQUENCE,
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
