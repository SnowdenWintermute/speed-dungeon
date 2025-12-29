import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import {
  ActionResolutionStepConfig,
  CosmeticEffectOnTargetTransformNode,
} from "../../combat-action-steps-config.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";

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

finalStepOverrides[ActionResolutionStepType.RecoveryMotion] = {
  getCosmeticEffectsToStart: (context) => {
    const { actionExecutionIntent } = context.tracker;
    const targetingCalculator = new TargetingCalculator(context.actionUserContext, null);

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
      COMBAT_ACTIONS[actionExecutionIntent.actionName],
      actionExecutionIntent.targets
    );
    if (targetIdsResult instanceof Error) throw targetIdsResult;

    const toReturn: CosmeticEffectOnTargetTransformNode[] = targetIdsResult.map((targetId) => {
      return {
        name: CosmeticEffectNames.HeartParticles,
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

    toReturn.push({
      name: CosmeticEffectNames.HeartParticles,
      lifetime: 700,
      parent: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: context.actionUserContext.actionUser.getEntityId(),
        },
        transformNodeName: CombatantBaseChildTransformNodeName.Head,
      },
    });

    return toReturn;
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
export const TAME_PET_STEP_CONFIG = createStepsConfig(base, {
  steps: mainStepOverrides,
  finalSteps: finalStepOverrides,
});
