import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { ActionEntityName, AbstractParentType } from "../../../../action-entities/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { rangedAttackProjectileHitOutcomeProperties } from "./attack-ranged-main-hand-projectile.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { getProjectileShootingActionBaseStepsConfig } from "../projectile-shooting-action-base-steps-config.js";
import { ProjectileShootingActionType } from "../projectile-shooting-action-animation-names.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];
const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Bow);
stepsConfig.steps = {
  ...stepsConfig.steps,
  [ActionResolutionStepType.PostChamberingSpawnEntity]: {},
};

const config: CombatActionComponentConfig = {
  description: "Attack target using ranged weapon",
  origin: CombatActionOrigin.Attack,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  },
  stepsConfig,

  shouldExecute: () => true,
  getConcurrentSubActions(context) {
    const { combatActionTarget } = context.combatant.combatantProperties;
    if (!combatActionTarget) throw new Error("expected combatant target not found");
    return [
      new CombatActionExecutionIntent(
        CombatActionName.AttackRangedMainhandProjectile,
        combatActionTarget
      ),
    ];
  },
  getChildren: () => [],
  getParent: () => ATTACK,
  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const position = combatantContext.combatant.combatantProperties.position.clone();

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Arrow,
          parentOption: {
            type: AbstractParentType.UserMainHand,
            parentEntityId: context.combatantContext.combatant.entityProperties.id,
          },
        },
      },
    };
  },
};

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  config
);
