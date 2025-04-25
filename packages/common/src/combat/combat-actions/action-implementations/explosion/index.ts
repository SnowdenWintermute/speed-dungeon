import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG } from "../non-combatant-initiated-actions-common-config.js";
import {
  ActionMotionPhase,
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

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  ...NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG,
  description: "Deals kinetic fire damage in an area around the target",
  targetingProperties,
  hitOutcomeProperties: explosionHitOutcomeProperties,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Delivery]: {
        name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDelivery },
        // timing: { type: AnimationTimingType.Timed, duration: 1200 },
        timing: { type: AnimationTimingType.Timed, duration: 200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDissipation },
        // timing: { type: AnimationTimingType.Timed, duration: 700 },
        timing: { type: AnimationTimingType.Timed, duration: 200 },
      },
    };
    return animations;
  },
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return [];
  },

  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationSpawnEntity,
      ActionResolutionStepType.OnActivationActionEntityMotion,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
      ActionResolutionStepType.ActionEntityDissipationMotion,
    ];
  },
  motionPhasePositionGetters: {
    [ActionMotionPhase.Delivery]: (context) => {
      const { combatantContext, tracker } = context;
      const { actionExecutionIntent } = tracker;

      const targetingCalculator = new TargetingCalculator(combatantContext, null);
      const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
        combatantContext.party,
        actionExecutionIntent
      );
      if (primaryTargetResult instanceof Error) return primaryTargetResult;
      const target = primaryTargetResult;

      return { position: target.combatantProperties.homeLocation.clone() };
    },
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
