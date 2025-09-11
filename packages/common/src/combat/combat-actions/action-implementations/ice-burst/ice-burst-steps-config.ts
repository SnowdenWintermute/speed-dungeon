import {
  ActionEntity,
  ActionEntityName,
  CosmeticEffectNames,
} from "../../../../action-entities/index.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { AnimationType, DynamicAnimationName } from "../../../../app-consts.js";
import {
  ActionEntityBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntity: (context) => {
    const { party, combatant: user } = context.combatantContext;
    const { asShimmedUserOfTriggeredCondition } = user.combatantProperties;
    if (!asShimmedUserOfTriggeredCondition) {
      throw new Error("expected ice burst to be used by a condition");
    }
    const actionTarget = asShimmedUserOfTriggeredCondition.entityConditionWasAppliedTo;
    const primaryTargetResult = AdventuringParty.getCombatant(party, actionTarget);
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;

    const position = primaryTargetResult.combatantProperties.position;

    const entityProperties = { id: context.idGenerator.generate(), name: "ice burst" };
    const actionEntityProperties = {
      position,
      name: ActionEntityName.IceBurst,
    };

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: new ActionEntity(entityProperties, actionEntityProperties),
    };
  },
};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDelivery },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
      // timing: { type: AnimationTimingType.Timed, duration: 1000 },
    };
  },
  getCosmeticEffectsToStart: (context) => {
    const iceBurstEntity = context.tracker.getExpectedSpawnedActionEntity();
    return [
      {
        name: CosmeticEffectNames.FrostParticleBurst,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: iceBurstEntity.actionEntity.entityProperties.id,
          },
          transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
        },
        lifetime: 300,
      },
    ];
  },
};

const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

finalStepOverrides[ActionResolutionStepType.ActionEntityDissipationMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDissipation },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      // timing: { type: AnimationTimingType.Timed, duration: 1000 },
      smoothTransition: false,
    };
  },
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.EXPLOSION_ENTITY;
export const ICE_BURST_STEPS_CONFIG = createStepsConfig(base, {
  steps: stepOverrides,
  finalSteps: finalStepOverrides,
});
