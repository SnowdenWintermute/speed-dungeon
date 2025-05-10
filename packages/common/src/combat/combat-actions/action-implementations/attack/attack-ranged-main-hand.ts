import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK } from "./index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
} from "../../../../items/equipment/slots.js";
import { SpawnableEntity, SpawnableEntityType } from "../../../../spawnables/index.js";
import { ActionEntityName, EntityReferencePoint } from "../../../../action-entities/index.js";
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
import {
  ActionResolutionStepType,
  AnimationTimingType,
  EntityAnimation,
} from "../../../../action-processing/index.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../../../app-consts.js";
import { EquipmentAnimation } from "../../combat-action-steps-config.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];
const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Bow);
stepsConfig.steps = {
  ...stepsConfig.steps,
  [ActionResolutionStepType.PostChamberingSpawnEntity]: {},
  [ActionResolutionStepType.DeliveryMotion]: {
    ...stepsConfig.steps[ActionResolutionStepType.DeliveryMotion],
    getEquipmentAnimations: (user, animationLengths) => {
      const slot: TaggedEquipmentSlot = {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.MainHand,
      };

      const speciesLengths = animationLengths[user.combatantSpecies];
      const animationName = SkeletalAnimationName.EquipmentShortBowShoot;
      const animationNameString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
      const duration = speciesLengths[animationNameString] || 0;

      const animation: EntityAnimation = {
        name: { type: AnimationType.Skeletal, name: animationName },
        timing: { type: AnimationTimingType.Timed, duration },
      };

      const equipmentAnimation: EquipmentAnimation = { slot, animation };

      return [equipmentAnimation];
    },
  },
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

    const spawnableEntity: SpawnableEntity = {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Arrow,
          parentOption: {
            referencePoint: EntityReferencePoint.MainHandBone,
            entityId: context.combatantContext.combatant.entityProperties.id,
          },
        },
      },
    };

    return spawnableEntity;
  },
};

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  config
);
