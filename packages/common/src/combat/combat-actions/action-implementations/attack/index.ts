import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
  createHitOutcomeProperties,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../base-hierarchy-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionExecutionIntent } from "../../combat-action-execution-intent.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
} from "../../index.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../../../../action-processing/action-steps/index.js";
import { CombatantEquipment } from "../../../../combatants/combatant-equipment/index.js";

// placeholder since all this action does is get children
const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.MELEE_ATTACK,
  {}
);

export const ATTACK_CONFIG: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE(),
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getChildren: function (context: ActionResolutionStepContext, self: CombatActionComponent) {
      const { actionUser } = context.actionUserContext;
      const { actionExecutionIntent } = context.tracker;
      const { targets, rank } = actionExecutionIntent;

      let actionName = CombatActionName.AttackMeleeMainhand;

      if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(actionUser)) {
        actionName = CombatActionName.AttackRangedMainhand;
      }

      return [new CombatActionExecutionIntent(actionName, rank, targets)];
    },
  },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.DetermineChildActions]: {},
    },
    {
      // [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { getFinalSteps: (self) => self.finalSteps }
  ),
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, ATTACK_CONFIG);
