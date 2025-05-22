import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  ActionEntityBaseChildTransformNodeName,
  ActionEntityName,
  CombatantBaseChildTransformNodeName,
  CosmeticEffectNames,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeType,
} from "../../../../action-entities/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { iceBoltProjectileHitOutcomeProperties } from "./ice-bolt-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";
import { Vector3 } from "@babylonjs/core";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "An icy projectile",
  origin: CombatActionOrigin.SpellCast,
  targetingProperties,
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
  getChildren: (context) => [],
  getParent: () => ICE_BOLT_PARENT,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
  },

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getDestination: getPrimaryTargetPositionAsDestination,
        getNewParent: () => null,
        getStartPointingToward: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;
          // @PERF - can probably combine all these individual targetingCalculator creations
          // and pass the targetId to getStartPointingTowardEntityOption and getCosmeticDestinationY et al
          const targetingCalculator = new TargetingCalculator(combatantContext, null);
          const primaryTargetId =
            targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);
          return {
            identifier: {
              type: SceneEntityChildTransformNodeType.CombatantBase,
              entityId: primaryTargetId,
              transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
            },
            duration: 400,
          };
        },
        getCosmeticDestinationY: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;

          const targetingCalculator = new TargetingCalculator(combatantContext, null);
          const primaryTargetId =
            targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);

          const entityPart: SceneEntityChildTransformNodeIdentifier = {
            type: SceneEntityChildTransformNodeType.CombatantBase,
            entityId: primaryTargetId,
            transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
          };
          return entityPart;
        },
        getCosmeticsEffectsToStart: (context) => {
          const iceBoltProjectile = context.tracker.getExpectedSpawnedActionEntity();
          return [
            {
              name: CosmeticEffectNames.FrostParticleStream,
              parent: {
                type: SceneEntityChildTransformNodeType.ActionEntityBase,
                entityId: iceBoltProjectile.actionEntity.entityProperties.id,
                transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
              },
            },
          ];
        },
        shouldDespawnOnComplete: () => true,
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {
        getCosmeticsEffectsToStart: (context) => {
          const iceBoltProjectile = context.tracker.getExpectedSpawnedActionEntity();
          return [
            {
              name: CosmeticEffectNames.FrostParticleBurst,
              parent: {
                type: SceneEntityChildTransformNodeType.CombatantBase,
                entityId: iceBoltProjectile.actionEntity.entityProperties.id,
                transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
              },
              lifetime: 300,
            },
          ];
        },
      },
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party, combatant } = combatantContext;
    const position = combatantContext.combatant.combatantProperties.position.clone();

    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;
    const target = primaryTargetResult;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.IceBolt,
          initialRotation: new Vector3(Math.PI / 2, 0, 0),
          parentOption: {
            type: SceneEntityChildTransformNodeType.CombatantBase,
            entityId: combatant.entityProperties.id,
            transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
          },
          pointTowardEntityOption: target.entityProperties.id,
        },
      },
    };
  },
};

export const ICE_BOLT_PROJECTILE = new CombatActionComposite(
  CombatActionName.IceBoltProjectile,
  config
);
