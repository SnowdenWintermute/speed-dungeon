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
import { CombatantSpecies } from "../../../../../combatants/index.js";
import { SpawnableEntityType, getSpawnableEntityId } from "../../../../../spawnables/index.js";
import {
  CombatantHoldableChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../../scene-entities/index.js";
import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { RANGED_SKILL_STEPS_CONFIG } from "./ranged-skill.js";
import { ProjectileFactory } from "../projectile-factory.js";

const base = cloneDeep(RANGED_SKILL_STEPS_CONFIG);
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
    getSpawnableEntities: (context) => {
      const projectileFactory = new ProjectileFactory(context, {});

      const spawnableEntity = projectileFactory.createArrowInHand();

      return [spawnableEntity];
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
  getAuxiliaryEntityMotions: lockArrowsToFaceArrowRest,
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
  user: IActionUser,
  animationLengths: Record<CombatantSpecies, Record<string, number>>
) {
  const slot: TaggedEquipmentSlot = {
    type: EquipmentSlotType.Holdable,
    slot: HoldableSlotType.MainHand,
  };

  const equipmentOption = user.getEquipmentOption();
  if (equipmentOption === null) throw new Error("expected user to have equipment");

  const equippedBowOption = equipmentOption.getEquipmentInSlot(slot);
  if (
    equippedBowOption?.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType !==
    EquipmentType.TwoHandedRangedWeapon
  )
    return [];

  const speciesLengths = animationLengths[user.getCombatantProperties().combatantSpecies];
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

function lockArrowsToFaceArrowRest(context: ActionResolutionStepContext) {
  const toReturn: EntityMotionUpdate[] = [];
  for (const spawnedEnity of context.tracker.spawnedEntities) {
    if (spawnedEnity.type !== SpawnableEntityType.ActionEntity)
      throw new Error("only expected action entities in lockArrowToFaceArrowRest");
    const actionEntity = spawnedEnity;

    const combatantProperties = context.actionUserContext.actionUser.getCombatantProperties();
    const bowOption = combatantProperties.equipment.getEquipmentInSlot({
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });

    if (!bowOption) {
      console.error("expected combatant to be wearing a bow");
      return [];
    }

    const actionEntityId = getSpawnableEntityId(actionEntity);

    const characterModelId = context.actionUserContext.actionUser.getEntityId();

    const parent: SceneEntityChildTransformNodeIdentifier = {
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterEquipmentModel,
        characterModelId,
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
        characterModelId,
        slot: HoldableSlotType.MainHand,
      },
      transformNodeName: CombatantHoldableChildTransformNodeName.ArrowRest,
    };

    const lockRotationToFace: SceneEntityChildTransformNodeIdentifierWithDuration = {
      identifier: arrowRestIdentifier,
      duration: 400,
    };

    toReturn.push({
      entityId: actionEntityId,
      entityType: SpawnableEntityType.ActionEntity,
      setParent,
      lockRotationToFace,
    });
  }

  return toReturn;
}
