import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
} from "../../index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ActivatedTriggersGameUpdateCommand } from "../../../../action-processing/game-update-commands.js";
import { createGenericSpellCastMessageProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { ActionPayableResource } from "../../action-calculation-utils/action-costs.js";

const stepsConfig = createStepsConfig(ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.SUMMON_COMBATANT, {
  steps: {},
});

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
  costBases: { [ActionPayableResource.ActionPoints]: { base: 0 } },
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {
    getOnUseTriggers: (context) => {
      console.log(
        "summon pet appear action user:",
        context.actionUserContext.actionUser.getEntityId()
      );
      const { rank } = context.tracker.actionExecutionIntent;
      const petSlot = rank - 1;

      const { actionUserContext } = context;
      const { actionUser } = actionUserContext;

      const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {
        petSlotsSummoned: [{ ownerId: actionUser.getEntityId(), slotIndex: petSlot }],
      };

      return toReturn;
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Summon a creature companion",
  prerequisiteAbilities: [],
  gameLogMessageProperties: createGenericSpellCastMessageProperties(
    CombatActionName.SummonPetAppear
  ),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME(),
  hitOutcomeProperties,
  costProperties,
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
  },
};

export const SUMMON_PET_APPEAR = new CombatActionLeaf(CombatActionName.SummonPetAppear, config);
