import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CosmeticEffectOnTargetTransformNode } from "../../combat-action-steps-config.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";
import { COMBAT_ACTIONS } from "../index.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BASIC_SPELL();
ActionStepConfigUtils.removeMoveForwardSteps(stepsConfig);

const initialPositioning = stepsConfig.steps[ActionResolutionStepType.InitialPositioning];

delete stepsConfig.steps[ActionResolutionStepType.FinalPositioning]?.getAnimation;
stepsConfig.steps[ActionResolutionStepType.FinalPositioning]!.shouldIdleOnComplete = true;

stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...initialPositioning,
  // getDestination:(context) => {},
  getCosmeticsEffectsToStart: (context) => {
    return [
      {
        name: CosmeticEffectNames.DarkParticleAccumulation,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: context.combatantContext.combatant.entityProperties.id,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
        },
      },
    ];
  },
};

stepsConfig.steps[ActionResolutionStepType.RecoveryMotion] = {
  ...stepsConfig.steps[ActionResolutionStepType.RecoveryMotion],
  getCosmeticsEffectsToStart: (context) => {
    const { actionExecutionIntent } = context.tracker;
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
      COMBAT_ACTIONS[actionExecutionIntent.actionName],
      actionExecutionIntent.targets
    );
    if (targetIdsResult instanceof Error) throw targetIdsResult;

    const toReturn: CosmeticEffectOnTargetTransformNode[] = targetIdsResult.map((targetId) => {
      return {
        name: CosmeticEffectNames.BlindnessCast,
        lifetime: 700,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: targetId,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.Head,
        },
      };
    });

    return toReturn;
  },
};

stepsConfig.steps[ActionResolutionStepType.FinalPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.FinalPositioning],
  getCosmeticsEffectsToStop: (context) => [
    {
      name: CosmeticEffectNames.DarkParticleAccumulation,
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: context.combatantContext.combatant.entityProperties.id,
      },
    },
  ],
};

// 84
export const BLIND_STEPS_CONFIG = stepsConfig;
