import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { FIRE_STEPS_CONFIG } from "../fire/fire-steps-config.js";
import { createStepsConfig } from "../generic-action-templates/step-config-templates/index.js";
import { Vector3 } from "@babylonjs/core";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import {
  ActionEntity,
  ActionEntityActionOriginData,
  ActionEntityName,
} from "../../../../action-entities/index.js";
import { BoxDimensions, ShapeType3D, TaggedBoxDimensions } from "../../../../utils/shape-utils.js";
import {
  GenericBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { BASE_PERSISTENT_ACTION_ENTITY_TICK_SPEED } from "../../../turn-order/consts.js";
import { MaxAndCurrent } from "../../../../primatives/max-and-current.js";
import {
  BASE_PERSISTENT_ACTION_ENTITY_MAX_STACKS,
  COMBAT_ACTION_MAX_LEVEL,
} from "../../../../app-consts.js";
import { ActionUserTargetingProperties } from "../../../../action-user-context/action-user-targeting-properties.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { EntityName } from "../../../../aliases.js";
import { ActionEntityProperties } from "../../../../action-entities/action-entity-properties.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};
const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const { party, actionUser } = context.actionUserContext;

    const { actionEntityManager } = party;
    const existingFirewallOption = actionEntityManager.getExistingActionEntityOfType(
      ActionEntityName.Firewall
    );

    if (existingFirewallOption !== null) {
      // so it can be targeted by the on activation motion step
      context.tracker.spawnedEntities.push({
        type: SpawnableEntityType.ActionEntity,
        actionEntity: existingFirewallOption,
      });
      // don't spawn it again
      return null;
    }

    const position = Vector3.Zero();

    const dimensions: BoxDimensions = {
      width: 7,
      height: 1.5,
      depth: 0.75,
    };

    const taggedDimensions: TaggedBoxDimensions = {
      type: ShapeType3D.Box,
      dimensions,
    };

    const selectedActionAndRank = actionUser.getTargetingProperties().getSelectedActionAndRank();

    const actionLevel = new MaxAndCurrent(
      COMBAT_ACTION_MAX_LEVEL,
      selectedActionAndRank?.rank || 1
    );

    const lifetime = new MaxAndCurrent(
      BASE_PERSISTENT_ACTION_ENTITY_MAX_STACKS,
      getFirewallStacksByLevel(actionLevel.current)
    );

    const actionOriginData = new ActionEntityActionOriginData(actionUser.getEntityProperties());
    actionOriginData.actionLevel = actionLevel;

    actionOriginData.userCombatantAttributes = actionUser.getTotalAttributes();
    actionOriginData.userElementalAffinities = actionUser
      .getCombatantProperties()
      .mitigationProperties.getElementalAffinities();
    actionOriginData.turnOrderSpeed = BASE_PERSISTENT_ACTION_ENTITY_TICK_SPEED;
    actionOriginData.stacks = lifetime;
    actionOriginData.targetingProperties = new ActionUserTargetingProperties();
    actionOriginData.spawnedBy = actionUser.getEntityProperties();

    const actionEntityProperties = new ActionEntityProperties(ActionEntityName.Firewall, position);

    actionEntityProperties.dimensions = taggedDimensions;
    actionEntityProperties.actionOriginData = actionOriginData;

    return [
      {
        type: SpawnableEntityType.ActionEntity,
        actionEntity: new ActionEntity(
          { id: context.idGenerator.generate(), name: "firewall" as EntityName },
          actionEntityProperties
        ),
      },
    ];
  },
};

finalStepOverrides[ActionResolutionStepType.RecoveryMotion] = {
  getCosmeticEffectsToStop(context) {
    const expectedFirewallEntity = context.tracker.getFirstExpectedSpawnedActionEntity();

    return [
      {
        name: CosmeticEffectNames.FirewallParticles,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: expectedFirewallEntity.actionEntity.entityProperties.id,
          },
          transformNodeName: GenericBaseChildTransformNodeName.EntityRoot,
        },
      },
    ];
  },
  getCosmeticEffectsToStart: (context) => {
    const expectedFirewallEntity = context.tracker.getFirstExpectedSpawnedActionEntity();

    const rankOption =
      expectedFirewallEntity.actionEntity.actionEntityProperties.actionOriginData?.actionLevel
        ?.current;
    if (rankOption === undefined) throw new Error("expected firewall to have a rank");

    return [
      {
        name: CosmeticEffectNames.FirewallParticles,
        rankOption,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: expectedFirewallEntity.actionEntity.entityProperties.id,
          },
          transformNodeName: GenericBaseChildTransformNodeName.EntityRoot,
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
  finalSteps: finalStepOverrides,
});

export const FIREWALL_STEPS_CONFIG = stepsConfig;

console.log("Firewall steps config:", JSON.stringify(FIREWALL_STEPS_CONFIG));

export function getFirewallStacksByLevel(actionLevel: number) {
  const baseFirewallLifetime = 0;
  if (actionLevel === 1) return 2;
  return actionLevel + baseFirewallLifetime;
}
