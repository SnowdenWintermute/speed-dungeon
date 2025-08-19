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
import {
  ActionResolutionStepType,
  EntityMotionUpdate,
} from "../../../../action-processing/index.js";
import { ATTACK_RANGED_MAIN_HAND } from "../attack/attack-ranged-main-hand.js";
import { SpawnableEntityType, getSpawnableEntityId } from "../../../../spawnables/index.js";
import { EquipmentType } from "../../../../items/equipment/index.js";
import { AbilityType } from "../../../../abilities/index.js";

const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Bow);

const config: CombatActionComponentConfig = {
  description: "Fire arrows which each bounce to up to two additional targets",
  origin: CombatActionOrigin.Attack,
  prerequisiteAbilities: [
    { type: AbilityType.Action, actionName: CombatActionName.ExplodingArrowParent },
  ],
  targetingProperties: {
    ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
    getRequiredEquipmentTypeOptions: () => [EquipmentType.TwoHandedRangedWeapon],
  },

  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} fires a chaining split arrow.`;
  },
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

      [ActionResolutionStepType.PostPrepSpawnEntity]: {},
      [ActionResolutionStepType.DeliveryMotion]:
        ATTACK_RANGED_MAIN_HAND.stepsConfig.steps[ActionResolutionStepType.DeliveryMotion],
      [ActionResolutionStepType.RecoveryMotion]: {
        ...stepsConfig.steps[ActionResolutionStepType.RecoveryMotion],
        getAuxiliaryEntityMotions: (context) => {
          const dummyArrowOption = context.tracker.spawnedEntityOption;
          if (!dummyArrowOption) return [];

          const actionEntityId = getSpawnableEntityId(dummyArrowOption);
          //
          const toReturn: EntityMotionUpdate[] = [];

          toReturn.push({
            entityId: actionEntityId,
            entityType: SpawnableEntityType.ActionEntity,
            despawn: true,
          });

          return toReturn;
        },
      },
    },
    { userShouldMoveHomeOnComplete: true }
  ),

  getSpawnableEntity: ATTACK_RANGED_MAIN_HAND.getSpawnableEntity,
  shouldExecute: () => true,
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(context) {
    return context.combatantContext
      .getOpponents()
      .filter((opponent) => opponent.combatantProperties.hitPoints > 0)
      .map(
        (opponent) =>
          new CombatActionExecutionIntent(
            CombatActionName.ChainingSplitArrowProjectile,
            {
              type: CombatActionTargetType.Single,
              targetId: opponent.entityProperties.id,
            },
            context.tracker.actionExecutionIntent.level
          )
      );
  },
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
