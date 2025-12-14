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
  CombatantTraitProperties,
  CombatantTraitType,
  IActionUser,
  KineticDamageType,
  MagicalElement,
  MonsterType,
  SceneEntityType,
  SkeletalAnimationName,
  SpawnableEntityType,
  TargetingCalculator,
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

    // so we can't target the web with other webs
    web.combatantProperties.abilityProperties.getTraitProperties().inherentTraitLevels = {
      [CombatantTraitType.CanNotBeRestrained]: 1,
    };

    const { combatantProperties } = web;

    const { actionUser } = context.actionUserContext;

    combatantProperties.removeFromPartyOnDeath = true;
    combatantProperties.giveThreatGeneratedToId = actionUser.getEntityId();

    combatantProperties.onDeathProperties = { removeConditionsApplied: true };

    const traitProperties = combatantProperties.abilityProperties.getTraitProperties();
    traitProperties.inherentTraitLevels[CombatantTraitType.Passive] = 1;

    // determine web's stats based on action rank and user's attributes
    const actionRank = context.tracker.actionExecutionIntent.rank;
    combatantProperties.classProgressionProperties.getMainClass().level = actionRank;
    applyWebInherentAffinities(actionUser, actionRank, traitProperties);

    combatantProperties.controlledBy.controllerType = CombatantControllerType.Neutral;

    // scale to the target's bounding box
    const { party } = context.actionUserContext;
    const targetingCalculator = new TargetingCalculator(context.actionUserContext, null);
    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      context.tracker.actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) {
      throw primaryTargetResult;
    }

    const boundingBoxSizes = context.manager.sequentialActionManagerRegistry.boundingBoxSizes;

    const primaryTargetBoundingBoxSize =
      boundingBoxSizes[primaryTargetResult.combatantProperties.combatantSpecies]?.volume;

    // looks good on humanoid, wolf and manta ray when based off their skeleton's bounding box volume
    const BOUNDING_BOX_VOLUME_TO_WEB_SIZE_MULTIPLIER = 0.25;

    if (primaryTargetBoundingBoxSize !== undefined) {
      web.combatantProperties.transformProperties.scaleModifier =
        primaryTargetBoundingBoxSize * BOUNDING_BOX_VOLUME_TO_WEB_SIZE_MULTIPLIER;
    }

    // testing if we can kill this if the thing it is attached to dies first:
    web.combatantProperties.shouldDieWhenCombatantAttachedToDies = true;

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

function applyWebInherentAffinities(
  actionUser: IActionUser,
  actionRank: number,
  webTraitProperties: CombatantTraitProperties
) {
  // determine web's stats based on action rank and user's attributes
  const baseSlashingAffinity = -100;
  const baseFireAffinity = -100;
  const baseBluntAffinity = 25;
  const basePiercingAffinity = 25;
  let slashingAffinity = baseSlashingAffinity;
  let fireAffinity = baseFireAffinity;
  let bluntAffinity = baseBluntAffinity;
  let piercingAffinity = basePiercingAffinity;

  if (actionRank > 1) {
    for (let i = 0; i < actionRank - 1; i += 1) {
      slashingAffinity /= 2;
      fireAffinity /= 2;
      bluntAffinity *= 2;
      piercingAffinity *= 2;
    }
  }

  webTraitProperties.inherentElementalAffinities[MagicalElement.Fire] = fireAffinity;
  webTraitProperties.inherentKineticDamageTypeAffinities[KineticDamageType.Slashing] =
    slashingAffinity;
  webTraitProperties.inherentKineticDamageTypeAffinities[KineticDamageType.Blunt] = bluntAffinity;
  webTraitProperties.inherentKineticDamageTypeAffinities[KineticDamageType.Piercing] =
    piercingAffinity;
}
