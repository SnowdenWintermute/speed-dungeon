import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
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
import { getProjectileShootingActionBaseStepsConfig } from "../projectile-shooting-action-base-steps-config.js";
import { ProjectileShootingActionType } from "../projectile-shooting-action-animation-names.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea];

const config: CombatActionComponentConfig = {
  description: "Fire arrows which each bounce to up to two additional targets",
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  },
  stepsConfig: getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Bow),

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
