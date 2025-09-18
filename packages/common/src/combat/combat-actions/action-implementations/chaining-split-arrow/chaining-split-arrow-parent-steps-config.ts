import {
  ActionResolutionStepType,
  EntityMotionUpdate,
} from "../../../../action-processing/index.js";
import { getSpawnableEntityId, SpawnableEntityType } from "../../../../spawnables/index.js";
import { CleanupMode } from "../../../../types.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BOW_SKILL;
const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

finalStepOverrides[ActionResolutionStepType.RecoveryMotion] = {
  getAuxiliaryEntityMotions: (context) => {
    const dummyArrowOption = context.tracker.spawnedEntityOption;

    if (!dummyArrowOption) return [];

    const actionEntityId = getSpawnableEntityId(dummyArrowOption);
    const toReturn: EntityMotionUpdate[] = [];

    toReturn.push({
      entityId: actionEntityId,
      entityType: SpawnableEntityType.ActionEntity,
      despawnMode: CleanupMode.Immediate,
    });

    return toReturn;
  },
};

const config = createStepsConfig(base, {
  steps: {},
  finalSteps: finalStepOverrides,
});

// @BADPRACTICE not really great, but this is to avoid igniting the dummy arrow. Not like we're ever going to walk in
// an hazard right in front of us anyway, but if ever we implement that we'll have to change this
delete config.steps[ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers];

export const CHAINING_SPLIT_ARROW_PARENT_STEPS_CONFIG = config;
