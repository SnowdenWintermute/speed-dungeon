import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import {
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
  createTargetingPropertiesConfig,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ENSNARE_STEPS_CONFIG } from "./ensnare-steps.config.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {}
);

const config: CombatActionComponentConfig = {
  description: "Throw a net that brings the target to the ground and limits their movement",
  prerequisiteAbilities: [],
  gameLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.Ensnare),
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
    {
      prohibitedTargetCombatantStates: [
        ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE().prohibitedTargetCombatantStates,
        ProhibitedTargetCombatantStates.CanNotBeTargetedByRestraintActions,
      ],
    }
  ),
  hitOutcomeProperties,
  costProperties,
  stepsConfig: ENSNARE_STEPS_CONFIG,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,

    getConcurrentSubActions(context) {
      const user = context.tracker.getFirstExpectedSpawnedCombatant().combatant;

      return [
        {
          user,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.EnsnareMoveNetTowardTargetAndActivate,
            context.tracker.actionExecutionIntent.rank,
            context.tracker.actionExecutionIntent.targets
          ),
        },
      ];
    },
  },
};

export const ENSNARE = new CombatActionLeaf(CombatActionName.Ensnare, config);
