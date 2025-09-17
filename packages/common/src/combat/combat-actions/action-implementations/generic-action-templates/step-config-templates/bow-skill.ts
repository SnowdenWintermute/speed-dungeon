import cloneDeep from "lodash.clonedeep";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
  AnimationTimingType,
  EntityAnimation,
  EntityMotionUpdate,
} from "../../../../../action-processing/index.js";
import {
  ActionResolutionStepsConfig,
  EquipmentAnimation,
} from "../../../combat-action-steps-config.js";
import { PROJECTILE_SKILL_STEPS_CONFIG } from "./projectile-skill.js";
import { getSpeciesTimedAnimation } from "../../get-species-timed-animation.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../../../../app-consts.js";
import {
  EquipmentSlotType,
  EquipmentType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  TwoHandedRangedWeapon,
} from "../../../../../items/equipment/index.js";
import { getRotateTowardPrimaryTargetDestination } from "../../common-destination-getters.js";
import {
  CombatantEquipment,
  CombatantProperties,
  CombatantSpecies,
} from "../../../../../combatants/index.js";
import {
  SpawnableEntity,
  SpawnableEntityType,
  getSpawnableEntityId,
} from "../../../../../spawnables/index.js";
import {
  CombatantBaseChildTransformNodeName,
  CombatantHoldableChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../../scene-entities/index.js";
import { ActionEntity, ActionEntityName } from "../../../../../action-entities/index.js";
import { Vector3 } from "@babylonjs/core";

const base = cloneDeep(PROJECTILE_SKILL_STEPS_CONFIG);
delete base.steps[ActionResolutionStepType.RollIncomingHitOutcomes];

export const BOW_EQUIPMENT_ANIMATIONS: Record<TwoHandedRangedWeapon, SkeletalAnimationName> = {
  [TwoHandedRangedWeapon.ShortBow]: SkeletalAnimationName.EquipmentShortBowShoot,
  [TwoHandedRangedWeapon.RecurveBow]: SkeletalAnimationName.EquipmentRecurveBowShoot,
  [TwoHandedRangedWeapon.CompositeBow]: SkeletalAnimationName.EquipmentCompositeBowShoot,
  [TwoHandedRangedWeapon.MilitaryBow]: SkeletalAnimationName.EquipmentMilitaryBowShoot,
  [TwoHandedRangedWeapon.EtherBow]: SkeletalAnimationName.EquipmentEtherBowShoot,
};

base.steps = {
  ...base.steps,
  [ActionResolutionStepType.PrepMotion]: {
    getDestination: getRotateTowardPrimaryTargetDestination,
    getAnimation: (user, animationLengths) =>
      // a one-off ActionExecutionPhase since no other action has a prep motion yet
      getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowPrep, true),
  },
  [ActionResolutionStepType.PostPrepSpawnEntity]: {
    getSpawnableEntity: (context) => {
      const { combatantContext } = context;
      const position = combatantContext.combatant.combatantProperties.position.clone();

      const spawnableEntity: SpawnableEntity = {
        type: SpawnableEntityType.ActionEntity,
        actionEntity: new ActionEntity(
          { id: context.idGenerator.generate(), name: "" },
          {
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
          }
        ),
      };

      return spawnableEntity;
    },
  },
  [ActionResolutionStepType.StartConcurrentSubActions]: {},
};

base.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...base.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowChambering, false),
};

base.steps[ActionResolutionStepType.DeliveryMotion] = {
  ...base.steps[ActionResolutionStepType.DeliveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowDelivery, false),

  getEquipmentAnimations: getBowEquipmentAnimation,
  getAuxiliaryEntityMotions: lockArrowToFaceArrowRest,
};

base.finalSteps[ActionResolutionStepType.RecoveryMotion] = {
  ...base.finalSteps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowRecovery, false),
};

export const BOW_SKILL_STEPS_CONFIG = new ActionResolutionStepsConfig(
  base.steps,
  base.finalSteps,
  base.options
);

function getBowEquipmentAnimation(
  user: CombatantProperties,
  animationLengths: Record<CombatantSpecies, Record<string, number>>
) {
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
}

function lockArrowToFaceArrowRest(context: ActionResolutionStepContext) {
  const actionEntity = context.tracker.spawnedEntityOption;
  if (!actionEntity) {
    console.error("expected an arrow to have been spawned");
    return [];
  }

  const { combatantProperties } = context.combatantContext.combatant;
  const bowOption = CombatantEquipment.getEquipmentInSlot(combatantProperties, {
    type: EquipmentSlotType.Holdable,
    slot: HoldableSlotType.MainHand,
  });

  if (!bowOption) {
    console.error("expected combatant to be wearing a bow");
    return [];
  }

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
}
