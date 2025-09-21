import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { FIRE_STEPS_CONFIG } from "../fire/fire-steps-config.js";
import { createStepsConfig } from "../generic-action-templates/step-config-templates/index.js";
import { Vector3 } from "@babylonjs/core";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import {
  ActionEntity,
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
import { BASE_PERSISTENT_ACTION_ENTITY_TICK_SPEED } from "../../../turn-order/consts.js";
import { MaxAndCurrent } from "../../../../primatives/max-and-current.js";
import {
  BASE_PERSISTENT_ACTION_ENTITY_MAX_STACKS,
  COMBAT_ACTION_MAX_LEVEL,
} from "../../../../app-consts.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntity: (context) => {
    const { party, combatant: user } = context.combatantContext;

    const existingFirewallOption = AdventuringParty.getExistingActionEntityOfType(
      party,
      ActionEntityName.Firewall
    );

    if (existingFirewallOption !== null) {
      // so it can be targeted by the on activation motion step
      context.tracker.spawnedEntityOption = {
        type: SpawnableEntityType.ActionEntity,
        actionEntity: existingFirewallOption,
      };
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

    const actionLevel = new MaxAndCurrent(
      COMBAT_ACTION_MAX_LEVEL,
      user.combatantProperties.selectedActionLevel || 1
    );

    const lifetime = new MaxAndCurrent(
      BASE_PERSISTENT_ACTION_ENTITY_MAX_STACKS,
      getFirewallStacksByLevel(actionLevel.current)
    );

    const actionOriginData: ActionEntityActionOriginData = {
      actionLevel,
      userCombatantAttributes: CombatantProperties.getTotalAttributes(user.combatantProperties),
      userElementalAffinities: CombatantProperties.getCombatantTotalElementalAffinities(
        user.combatantProperties
      ),
      turnOrderSpeed: BASE_PERSISTENT_ACTION_ENTITY_TICK_SPEED,
      stacks: lifetime,
    };

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: new ActionEntity(
        { id: context.idGenerator.generate(), name: "firewall" },
        {
          position,
          name: ActionEntityName.Firewall,
          dimensions: taggedDimensions,
          actionOriginData,
        }
      ),
    };
  },
};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getCosmeticEffectsToStop(context) {
    const expectedFirewallEntity = context.tracker.spawnedEntityOption;
    if (expectedFirewallEntity === null) throw new Error("expected firewall entity not found");
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
  getCosmeticEffectsToStart: (context) => {
    const expectedFirewallEntity = context.tracker.spawnedEntityOption;
    if (expectedFirewallEntity === null) throw new Error("expected firewall entity not found");
    if (expectedFirewallEntity.type != SpawnableEntityType.ActionEntity)
      throw new Error("expected firewall entity to be action enity");

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

export function getFirewallStacksByLevel(actionLevel: number) {
  const baseFirewallLifetime = 0;
  if (actionLevel === 1) return 2;
  return actionLevel + baseFirewallLifetime;
}
