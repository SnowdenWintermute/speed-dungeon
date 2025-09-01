import {
  ActionResolutionStepsConfig,
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
} from "../../index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { genericCombatActionCostProperties } from "../../combat-action-cost-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  CombatActionCombatLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";

export const passTurnConfig: CombatActionComponentConfig = {
  description: "Skip your own turn",
  targetingProperties: {
    ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle],
    getValidTargetCategories: () => TargetCategories.User,
    usabilityContext: CombatActionUsabilityContext.InCombat,
    intent: CombatActionIntent.Benevolent,
  },
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} passes their turn`;
    },
  }),

  hitOutcomeProperties: {
    ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
    getThreatChangesOnHitOutcomes: (context, hitOutcomes) => null,
    getShouldDecayThreatOnUse: (context) => false,
  },
  costProperties: { ...genericCombatActionCostProperties, costBases: {} },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const PASS_TURN = new CombatActionLeaf(CombatActionName.PassTurn, passTurnConfig);
