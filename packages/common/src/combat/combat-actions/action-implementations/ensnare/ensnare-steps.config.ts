import cloneDeep from "lodash.clonedeep";
import { BASIC_SPELL_STEPS_CONFIG } from "../generic-action-templates/step-config-templates/basic-spell.js";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { getSpeciesTimedAnimation } from "../get-species-timed-animation.js";
import {
  Combatant,
  CombatantBaseChildTransformNodeName,
  CombatantClass,
  CombatantControlledBy,
  CombatantControllerType,
  CombatantProperties,
  CombatantSpecies,
  CombatantTraitType,
  MonsterType,
  SceneEntityType,
  SkeletalAnimationName,
  SpawnableEntityType,
} from "../../../../index.js";
import { Vector3 } from "@babylonjs/core";

const config = cloneDeep(BASIC_SPELL_STEPS_CONFIG);
ActionStepConfigUtils.removeMoveForwardSteps(config);

config.steps[ActionResolutionStepType.PostPrepSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const web = Combatant.createInitialized(
      { name: "Webbbbbbbbbbbbbbbbbbbbbbb", id: context.idGenerator.generate() },
      new CombatantProperties(
        CombatantClass.Warrior,
        CombatantSpecies.Net,
        MonsterType.Net,
        new CombatantControlledBy(CombatantControllerType.Dungeon, ""),
        Vector3.Zero()
      )
    );

    const { combatantProperties } = web;

    combatantProperties.removeFromPartyOnDeath = true;
    combatantProperties.giveThreatGeneratedToId =
      context.actionUserContext.actionUser.getEntityId();

    combatantProperties.onDeathProperties = { removeConditionsApplied: true };

    combatantProperties.abilityProperties.getTraitProperties().inherentTraitLevels[
      CombatantTraitType.Passive
    ] = 1;

    combatantProperties.controlledBy.controllerType = CombatantControllerType.Neutral;

    return [
      {
        type: SpawnableEntityType.Combatant,
        combatant: web,
        doNotIdle: true,
        parentTransformNodeOption: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: context.actionUserContext.actionUser.getEntityId(),
          },
          transformNodeName: CombatantBaseChildTransformNodeName.MainHandEquipment,
        },
      },
    ];
  },
};

config.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...config.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.ThrowObjectChambering,
      false
    ),
};

config.steps[ActionResolutionStepType.DeliveryMotion] = {
  ...config.steps[ActionResolutionStepType.DeliveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.ThrowObjectDelivery,
      false
    ),
};

config.steps[ActionResolutionStepType.EvalOnUseTriggers] = {};

config.finalSteps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.finalSteps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.ThrowObjectRecovery,
      false
    ),
};

export const ENSNARE_STEPS_CONFIG = config;
