import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CosmeticEffectOnTargetTransformNode } from "../../combat-action-steps-config.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import { COMBAT_ACTIONS } from "../index.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BASIC_SPELL();

stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.InitialPositioning],
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.LightParticleAccumulation,
        context
      ),
    ];
  },
};

stepsConfig.steps[ActionResolutionStepType.RecoveryMotion] = {
  ...stepsConfig.steps[ActionResolutionStepType.RecoveryMotion],
  getCosmeticEffectsToStart: (context) => {
    const { actionExecutionIntent } = context.tracker;
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
      COMBAT_ACTIONS[actionExecutionIntent.actionName],
      actionExecutionIntent.targets
    );
    if (targetIdsResult instanceof Error) throw targetIdsResult;

    const toReturn: CosmeticEffectOnTargetTransformNode[] = targetIdsResult.map((targetId) => {
      return {
        name: CosmeticEffectNames.LightParticleBurst,
        lifetime: 700,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: targetId,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
        },
      };
    });

    return toReturn;
  },
};

stepsConfig.steps[ActionResolutionStepType.FinalPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.FinalPositioning],
  getCosmeticEffectsToStop: (context) => [
    CosmeticEffectInstructionFactory.createParticlesOnOffhand(
      CosmeticEffectNames.LightParticleAccumulation,
      context
    ),
  ],
};

export const HEALING_STEPS_CONFIG = stepsConfig;
