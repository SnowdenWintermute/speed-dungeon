import {
  ActionResolutionStepsConfig,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { rangedAttackProjectileHitOutcomeProperties } from "../attack/attack-ranged-main-hand-projectile.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { getProjectileShootingActionBaseStepsConfig } from "../getProjectileShootingActionBaseStepsConfig.js";
import { ProjectileShootingActionType } from "../projectile-shooting-action-animation-names.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ATTACK_RANGED_MAIN_HAND } from "../attack/attack-ranged-main-hand.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea];

const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Bow);

const config: CombatActionComponentConfig = {
  description: "Fire arrows which each bounce to up to two additional targets",
  origin: CombatActionOrigin.Attack,
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      ...stepsConfig.steps,
      [ActionResolutionStepType.PrepMotion]:
        ATTACK_RANGED_MAIN_HAND.stepsConfig.steps[ActionResolutionStepType.PrepMotion],
    },
    { userShouldMoveHomeOnComplete: true }
  ),

  shouldExecute: () => true,
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
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
