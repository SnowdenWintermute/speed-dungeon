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
  CombatAttribute,
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
import { nameToPossessive, throwIfError } from "../../../../../utils/index.js";
import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { getAttackResourceChangeProperties } from "../../attack/get-attack-resource-change-properties.js";
import { COMBAT_ACTIONS } from "../../index.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../../combat-action-resource-change-properties.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";

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
      const { actionUserContext } = context;
      const { actionUser, party, game } = actionUserContext;
      const userPositionOption = actionUser.getPositionOption();
      if (userPositionOption === null) throw new Error("expected position");
      const position = userPositionOption.clone();

      const firedByCombatantName = actionUser.getName();

      const { actionExecutionIntent } = context.tracker;
      const { actionName, rank } = actionExecutionIntent;
      const action = COMBAT_ACTIONS[actionName];

      const targetingCalculator = new TargetingCalculator(actionUserContext, null);
      const primaryTarget = throwIfError(
        targetingCalculator.getPrimaryTargetCombatant(party, actionExecutionIntent)
      );

      const resourceChangeProperties = getBowAttackHitOutcomeProperties(
        actionUser,
        action.hitOutcomeProperties,
        rank,
        primaryTarget.combatantProperties
      );

      const spawnableEntity: SpawnableEntity = {
        type: SpawnableEntityType.ActionEntity,
        actionEntity: new ActionEntity(
          {
            id: context.idGenerator.generate(),
            name: `${nameToPossessive(firedByCombatantName)} arrow`,
          },
          {
            position,
            name: ActionEntityName.Arrow,
            initialRotation: new Vector3(Math.PI / 2, 0, 0),
            parentOption: {
              sceneEntityIdentifier: {
                type: SceneEntityType.CharacterModel,
                entityId: actionUser.getEntityId(),
              },
              transformNodeName: CombatantBaseChildTransformNodeName.MainHandEquipment,
            },
            actionOriginData: {
              spawnedBy: actionUser.getEntityProperties(),
              userCombatantAttributes: actionUser.getTotalAttributes(),
              resourceChangeProperties,
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
  user: IActionUser,
  animationLengths: Record<CombatantSpecies, Record<string, number>>
) {
  const slot: TaggedEquipmentSlot = {
    type: EquipmentSlotType.Holdable,
    slot: HoldableSlotType.MainHand,
  };

  const equipmentOption = user.getEquipmentOption();
  if (equipmentOption === null) throw new Error("expected user to have equipment");

  const equippedBowOption = CombatantEquipment.getEquipmentInSlot(equipmentOption, slot);
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

function lockArrowToFaceArrowRest(context: ActionResolutionStepContext) {
  const actionEntity = context.tracker.spawnedEntityOption;
  if (!actionEntity) {
    console.error("expected an arrow to have been spawned");
    return [];
  }

  const combatantProperties = context.actionUserContext.actionUser.getCombatantProperties();
  const bowOption = CombatantEquipment.getEquipmentInSlot(combatantProperties.equipment, {
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

  const toReturn: EntityMotionUpdate[] = [];

  toReturn.push({
    entityId: actionEntityId,
    entityType: SpawnableEntityType.ActionEntity,
    setParent,
    lockRotationToFace,
  });

  return toReturn;
}

export function getBowAttackHitOutcomeProperties(
  user: IActionUser,
  hitOutcomeProperties: CombatActionHitOutcomeProperties,
  actionRank: number,
  primaryTargetCombatantProperties: CombatantProperties
) {
  // Get the resource change properties now and store them on the projectile. This way
  // we can modify it in flight.
  const resourceChangeProperties: Partial<
    Record<CombatActionResource, CombatActionResourceChangeProperties>
  > = {};
  resourceChangeProperties[CombatActionResource.HitPoints] = getAttackResourceChangeProperties(
    user,
    hitOutcomeProperties,
    actionRank,
    primaryTargetCombatantProperties,
    CombatAttribute.Dexterity,
    // allow unusable weapons because it may be the case that the bow breaks
    // but the projectile has yet to caluclate it's hit, and it should still consider
    // the bow it was fired from
    // it should never add weapon properties from an initially broken weapon because the projectile would not
    // be allowed to be fired from a broken weapon
    { usableWeaponsOnly: false }
  );

  return resourceChangeProperties;
}
