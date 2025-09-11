import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { FIRE_STEPS_CONFIG } from "../fire/fire-steps-config.js";
import { createStepsConfig } from "../generic-action-templates/step-config-templates/index.js";
import { Vector3 } from "@babylonjs/core";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import {
  ActionEntityActionOriginData,
  ActionEntityName,
  CosmeticEffectNames,
} from "../../../../action-entities/index.js";
import { BoxDimensions, ShapeType3D, TaggedBoxDimensions } from "../../../../utils/shape-utils.js";
import {
  ActionEntityBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { CombatantProperties } from "../../../../combatants/index.js";

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

    const actionLevel = user.combatantProperties.selectedActionLevel || 1;

    console.log("USER SELECTEDACTIONLEVEL AT TIME OF FIREWALL CAST", actionLevel);

    const actionOriginData = {
      actionLevel,
      userCombatantAttributes: CombatantProperties.getTotalAttributes(user.combatantProperties),
      userElementalAffinities: CombatantProperties.getCombatantTotalElementalAffinities(
        user.combatantProperties
      ),
    };

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "firewall" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Firewall,
          dimensions: taggedDimensions,
          actionOriginData,
        },
      },
    };
  },
};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getCosmeticEffectsToStart: (context) => {
    const expectedFirewallEntity = context.tracker.spawnedEntityOption;
    if (expectedFirewallEntity === null)
      throw new Error("expected to have spawned firewall entity");
    if (expectedFirewallEntity.type != SpawnableEntityType.ActionEntity)
      throw new Error("expected firewall entity to be action enity");
    return [
      {
        name: CosmeticEffectNames.FirewallParticles,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: expectedFirewallEntity.actionEntity.entityProperties.id,
          },
          transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
        },
      },
    ];
  },
};

const base = cloneDeep(FIRE_STEPS_CONFIG);
delete base.steps[ActionResolutionStepType.RollIncomingHitOutcomes];
delete base.finalSteps[ActionResolutionStepType.RecoveryMotion]?.getCosmeticEffectsToStart;

const stepsConfig = createStepsConfig(() => base, {
  steps: stepOverrides,
});

export const FIREWALL_STEPS_CONFIG = stepsConfig;
