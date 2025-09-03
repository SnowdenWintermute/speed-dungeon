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
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { COMBAT_ACTIONS } from "../index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

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
        name: CosmeticEffectNames.FireParticlesSmall,
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

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.VALUE_CHANGE_TICK;
export const BURNING_TICK_STEPS_CONFIG = createStepsConfig(base, { steps: stepOverrides });
