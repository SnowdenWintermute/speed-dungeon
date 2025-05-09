import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import {
  ActionEntityPointTowardEntity,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  AbstractEntityPart,
  ActionEntityName,
  CosmeticEffectNames,
  EntityReferencePoint,
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
        getStartPointingTowardEntityOption: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;
          // @PERF - can probably combine all these individual targetingCalculator creations
          // and pass the targetId to getStartPointingTowardEntityOption and getCosmeticDestinationY et al
          const targetingCalculator = new TargetingCalculator(combatantContext, null);
          const primaryTargetId =
            targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);
          return {
            targetId: primaryTargetId,
            positionOnTarget: EntityReferencePoint.CombatantHitboxCenter,
            duration: 400,
          };
        },
        getCosmeticDestinationY: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;

          const targetingCalculator = new TargetingCalculator(combatantContext, null);
          const primaryTargetId =
            targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);
          const entityPart: AbstractEntityPart = {
            referencePoint: EntityReferencePoint.CombatantHitboxCenter,
            entityId: primaryTargetId,
          };
          return entityPart;
        },
        cosmeticsEffectsToStart: [
          {
            name: CosmeticEffectNames.FrostParticleStream,
            parentType: EntityReferencePoint.VfxEntityRoot,
          },
        ],
        shouldDespawnOnComplete: () => true,
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {
        cosmeticsEffectsToStart: [
          {
            name: CosmeticEffectNames.FrostParticleBurst,
            parentType: EntityReferencePoint.CombatantHitboxCenter,
            lifetime: 300,
          },
        ],
      },
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party } = combatantContext;
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
          parentOption: {
            referencePoint: EntityReferencePoint.OffHandBone,
            entityId: context.combatantContext.combatant.entityProperties.id,
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
