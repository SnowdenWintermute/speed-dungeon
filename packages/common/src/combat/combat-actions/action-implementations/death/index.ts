import {
  ActionResolutionStepsConfig,
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionResource,
} from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  CombatActionGameLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_IN_COMBAT,
  { executionPreconditions: [], intent: CombatActionIntent.Benevolent }
);

export const passTurnConfig: CombatActionComponentConfig = {
  description: "Used for killing combatants usually as a result of other events",
  targetingProperties,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => ``,
  }),

  hitOutcomeProperties: createHitOutcomeProperties(
    HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
    {
      resourceChangePropertiesGetters: {
        [CombatActionResource.HitPoints]: (
          user,
          hitOutcomeProperties,
          actionRank,
          primaryTarget
        ) => {
          return {
            resourceChangeSource: new ResourceChangeSource({
              category: ResourceChangeSourceCategory.Direct,
            }),
            baseValues: new NumberRange(
              primaryTarget.resources.getHitPoints(),
              primaryTarget.resources.getHitPoints()
            ),
          };
        },
      },
    }
  ),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    {
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { getFinalSteps: (self) => self.finalSteps }
  ),
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const DEATH = new CombatActionLeaf(CombatActionName.Death, passTurnConfig);
