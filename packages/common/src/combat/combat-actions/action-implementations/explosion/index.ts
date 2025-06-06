import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AnimationType, DynamicAnimationName } from "../../../../app-consts.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import { ActionEntityName } from "../../../../action-entities/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { explosionHitOutcomeProperties } from "./explosion-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "Deals kinetic fire damage in an area around the target",
  origin: CombatActionOrigin.TriggeredCondition,
  targetingProperties,
  hitOutcomeProperties: explosionHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getAnimation: () => {
          return {
            name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDelivery },
            // timing: { type: AnimationTimingType.Timed, duration: 1200 },
            timing: { type: AnimationTimingType.Timed, duration: 200 },
            smoothTransition: false,
          };
        },
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.ActionEntityDissipationMotion]: {
        getAnimation: () => {
          return {
            name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDissipation },
            // timing: { type: AnimationTimingType.Timed, duration: 700 },
            timing: { type: AnimationTimingType.Timed, duration: 200 },
            smoothTransition: false,
          };
        },
        shouldDespawnOnComplete: () => true,
      },
    },
    { userShouldMoveHomeOnComplete: false }
  ),
  shouldExecute: () => true,
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return [];
  },

  getSpawnableEntity: (context) => {
    const { actionExecutionIntent } = context.tracker;
    const { party } = context.combatantContext;
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
    const primaryTargetIdResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetIdResult instanceof Error) throw primaryTargetIdResult;

    const position = primaryTargetIdResult.combatantProperties.position;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "explosion" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Explosion,
        },
      },
    };
  },
};

export const EXPLOSION = new CombatActionComposite(CombatActionName.Explosion, config);
