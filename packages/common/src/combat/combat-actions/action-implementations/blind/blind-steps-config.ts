import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import {
  ActionResolutionStepConfig,
  CosmeticEffectOnTargetTransformNode,
} from "../../combat-action-steps-config.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";
import { COMBAT_ACTIONS } from "../index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.InitialPositioning] = {
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.DarkParticleAccumulation,
        context
      ),
    ];
  },
};

stepOverrides[ActionResolutionStepType.RecoveryMotion] = {
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

stepOverrides[ActionResolutionStepType.FinalPositioning] = {
  getCosmeticEffectsToStop: (context) => [
    CosmeticEffectInstructionFactory.createParticlesOnOffhand(
      CosmeticEffectNames.DarkParticleAccumulation,
      context
    ),
  ],
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BASIC_SPELL;
const stepsConfig = createStepsConfig(base, { steps: stepOverrides });

ActionStepConfigUtils.removeMoveForwardSteps(stepsConfig);
delete stepsConfig.steps[ActionResolutionStepType.FinalPositioning]?.getAnimation;
stepsConfig.steps[ActionResolutionStepType.FinalPositioning]!.shouldIdleOnComplete = true;

export const BLIND_STEPS_CONFIG = stepsConfig;
