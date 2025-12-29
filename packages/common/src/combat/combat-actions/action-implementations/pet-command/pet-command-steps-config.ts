import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";

const mainStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};
const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

mainStepOverrides[ActionResolutionStepType.InitialPositioning] = {
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.LightParticleAccumulation,
        context
      ),
    ];
  },
};

finalStepOverrides[ActionResolutionStepType.FinalPositioning] = {
  getCosmeticEffectsToStop: (context) => [
    CosmeticEffectInstructionFactory.createParticlesOnOffhand(
      CosmeticEffectNames.LightParticleAccumulation,
      context
    ),
  ],
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BASIC_SPELL;
const stepsConfig = createStepsConfig(base, {
  steps: mainStepOverrides,
  finalSteps: finalStepOverrides,
});

ActionStepConfigUtils.removeMoveForwardSteps(stepsConfig);
delete stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning]?.getAnimation;
stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning]!.shouldIdleOnComplete = true;

export const PET_COMMAND_STEPS_CONFIG = stepsConfig;
