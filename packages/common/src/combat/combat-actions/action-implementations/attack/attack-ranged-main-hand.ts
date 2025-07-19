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
import {
  SpawnableEntity,
  SpawnableEntityType,
  getSpawnableEntityId,
} from "../../../../spawnables/index.js";
import { ActionEntityName } from "../../../../action-entities/index.js";
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
import { getProjectileShootingActionBaseStepsConfig } from "../getProjectileShootingActionBaseStepsConfig.js";
import { ProjectileShootingActionType } from "../projectile-shooting-action-animation-names.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
  EntityAnimation,
  EntityMotionUpdate,
} from "../../../../action-processing/index.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../../../app-consts.js";
import { EquipmentAnimation } from "../../combat-action-steps-config.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { getRotateTowardPrimaryTargetDestination } from "../common-destination-getters.js";
import { getSpeciesTimedAnimation } from "../get-species-timed-animation.js";
import {
  CombatantBaseChildTransformNodeName,
  CombatantHoldableChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { Vector3 } from "@babylonjs/core";
import { EquipmentType, TwoHandedRangedWeapon } from "../../../../items/equipment/index.js";

const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Bow);

export const BOW_EQUIPMENT_ANIMATIONS: Record<TwoHandedRangedWeapon, SkeletalAnimationName> = {
  [TwoHandedRangedWeapon.ShortBow]: SkeletalAnimationName.EquipmentShortBowShoot,
  [TwoHandedRangedWeapon.RecurveBow]: SkeletalAnimationName.EquipmentRecurveBowShoot,
  [TwoHandedRangedWeapon.CompositeBow]: SkeletalAnimationName.EquipmentCompositeBowShoot,
  [TwoHandedRangedWeapon.MilitaryBow]: SkeletalAnimationName.EquipmentMilitaryBowShoot,
  [TwoHandedRangedWeapon.EtherBow]: SkeletalAnimationName.EquipmentEtherBowShoot,
};

stepsConfig.steps = {
  ...stepsConfig.steps,
  [ActionResolutionStepType.PrepMotion]: {
    getDestination: getRotateTowardPrimaryTargetDestination,
    getAnimation: (user, animationLengths) =>
      // a one-off ActionExecutionPhase since no other action has a prep motion yet
      getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowPrep, true),
  },
  [ActionResolutionStepType.PostPrepSpawnEntity]: {},
  [ActionResolutionStepType.ChamberingMotion]: {
    ...stepsConfig.steps[ActionResolutionStepType.ChamberingMotion],
  },

  [ActionResolutionStepType.DeliveryMotion]: {
    ...stepsConfig.steps[ActionResolutionStepType.DeliveryMotion],

    getEquipmentAnimations: (user, animationLengths) => {
      const slot: TaggedEquipmentSlot = {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.MainHand,
      };

      const equippedBowOption = CombatantEquipment.getEquipmentInSlot(user, slot);
      if (
        equippedBowOption?.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType !==
        EquipmentType.TwoHandedRangedWeapon
      )
        return [];

      const speciesLengths = animationLengths[user.combatantSpecies];
      const animationName =
        BOW_EQUIPMENT_ANIMATIONS[
          equippedBowOption.equipmentBaseItemProperties.taggedBaseEquipment.baseItemType
        ];
      const animationNameString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
      const duration = speciesLengths[animationNameString] || 0;

      const animation: EntityAnimation = {
        name: { type: AnimationType.Skeletal, name: animationName },
        timing: { type: AnimationTimingType.Timed, duration },
        smoothTransition: false,
      };

      const equipmentAnimation: EquipmentAnimation = { slot, animation };

      return [equipmentAnimation];
    },
    getAuxiliaryEntityMotions: (context) => {
      const actionEntity = context.tracker.spawnedEntityOption;
      if (!actionEntity) return [];

      const { combatantProperties } = context.combatantContext.combatant;
      const bowOption = CombatantEquipment.getEquipmentInSlot(combatantProperties, {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.MainHand,
      });

      if (!bowOption) return [];

      const actionEntityId = getSpawnableEntityId(actionEntity);

      const parent: SceneEntityChildTransformNodeIdentifier = {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterEquipmentModel,
          characterModelId: context.combatantContext.combatant.entityProperties.id,
          slot: HoldableSlotType.MainHand,
        },
        transformNodeName: CombatantHoldableChildTransformNodeName.NockBone,
      };

      const setParent: SceneEntityChildTransformNodeIdentifierWithDuration = {
        identifier: parent,
        duration: 400,
      };

      const arrowRestIdentifier: SceneEntityChildTransformNodeIdentifier = {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterEquipmentModel,
          characterModelId: context.combatantContext.combatant.entityProperties.id,
          slot: HoldableSlotType.MainHand,
        },
        transformNodeName: CombatantHoldableChildTransformNodeName.ArrowRest,
      };

      const lockRotationToFace: SceneEntityChildTransformNodeIdentifierWithDuration = {
        identifier: arrowRestIdentifier,
        duration: 400,
      };

      const toReturn: EntityMotionUpdate[] = [];

      toReturn.push({
        entityId: actionEntityId,
        entityType: SpawnableEntityType.ActionEntity,
        setParent,
        lockRotationToFace,
      });

      return toReturn;
    },
  },
};

export const ATTACK_RANGED_MAIN_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using ranged weapon",
  origin: CombatActionOrigin.Attack,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  targetingProperties: {
    ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
    requiredEquipmentTypeOptions: [EquipmentType.TwoHandedRangedWeapon],
  },
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  },
  stepsConfig,

  shouldExecute: () => true,
  getOnUseMessage: null,
  getConcurrentSubActions(context) {
    return [
      new CombatActionExecutionIntent(
        CombatActionName.AttackRangedMainhandProjectile,
        context.tracker.actionExecutionIntent.targets
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
          initialRotation: new Vector3(Math.PI / 2, 0, 0),
          parentOption: {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: context.combatantContext.combatant.entityProperties.id,
            },
            transformNodeName: CombatantBaseChildTransformNodeName.MainHandEquipment,
          },
        },
      },
    };

    return spawnableEntity;
  },
};

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  ATTACK_RANGED_MAIN_HAND_CONFIG
);
