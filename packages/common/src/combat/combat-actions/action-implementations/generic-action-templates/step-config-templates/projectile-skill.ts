import cloneDeep from "lodash.clonedeep";
import {
  ActionResolutionStepType,
  EntityMotionUpdate,
} from "../../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../../scene-entities/index.js";
import { SpawnableEntityType, getSpawnableEntityId } from "../../../../../spawnables/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
import { RANGED_SKILL_STEPS_CONFIG } from "./ranged-skill.js";

const config = cloneDeep(RANGED_SKILL_STEPS_CONFIG);
config.finalSteps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.finalSteps[ActionResolutionStepType.RecoveryMotion],
  getAuxiliaryEntityMotions: (context) => {
    const { actionUserContext } = context;
    const { party } = actionUserContext;
    const targetingCalculator = new TargetingCalculator(actionUserContext, null);
    const primaryTarget = targetingCalculator.getPrimaryTargetCombatant(
      party,
      context.tracker.actionExecutionIntent
    );
    if (primaryTarget instanceof Error) throw primaryTarget;

    const actionEntity = context.tracker.spawnedEntityOption;
    if (!actionEntity) return [];
    // if (!actionEntity) throw new Error("expected action entity was missing");
    const actionEntityId = getSpawnableEntityId(actionEntity);

    const startPointingToward: SceneEntityChildTransformNodeIdentifierWithDuration = {
      identifier: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: primaryTarget.entityProperties.id,
        },
        transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
      },
      duration: 400,
    };

    const toReturn: EntityMotionUpdate[] = [];
    toReturn.push({
      entityId: actionEntityId,
      entityType: SpawnableEntityType.ActionEntity,
      startPointingToward,
      setParent: null,
    });

    return toReturn;
  },
};

export const PROJECTILE_SKILL_STEPS_CONFIG = new ActionResolutionStepsConfig(
  config.steps,
  config.finalSteps,
  config.options
);
