import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { FIRE_STEPS_CONFIG } from "../fire/fire-steps-config.js";
import { createStepsConfig } from "../generic-action-templates/step-config-templates/index.js";
import { Vector3 } from "@babylonjs/core";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { ActionEntityName } from "../../../../action-entities/index.js";
import { BoxDimensions, ShapeType3D, TaggedBoxDimensions } from "../../../../utils/shape-utils.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntity: (context) => {
    const { party, combatant: user } = context.combatantContext;

    const position = Vector3.Zero();

    const dimensions: BoxDimensions = {
      width: 7,
      height: 1.5,
      depth: 0.75,
    };

    position.y += dimensions.height / 2;

    const taggedDimensions: TaggedBoxDimensions = {
      type: ShapeType3D.Box,
      dimensions,
    };

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "firewall" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Firewall,
          dimensions: taggedDimensions,
        },
      },
    };
  },
};

const base = cloneDeep(FIRE_STEPS_CONFIG);
delete base.steps[ActionResolutionStepType.RollIncomingHitOutcomes];
delete base.steps[ActionResolutionStepType.RecoveryMotion]?.getCosmeticEffectsToStart;

const stepsConfig = createStepsConfig(() => base, {
  steps: stepOverrides,
});

export const FIREWALL_STEPS_CONFIG = stepsConfig;
