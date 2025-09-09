import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStepType,
  EntityMotionUpdate,
} from "../../../../action-processing/index.js";
import { getSpawnableEntityId, SpawnableEntityType } from "../../../../spawnables/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../../utils/index.js";
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
      despawn: true,
    });

    return toReturn;
  },
};

export const CHAINING_SPLIT_ARROW_PARENT_STEPS_CONFIG = createStepsConfig(base, {
  steps: {},
  finalSteps: finalStepOverrides,
});
