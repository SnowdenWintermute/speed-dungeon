import { CombatActionComponentConfig, CombatActionLeaf } from "../../index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { START_FLYING_STEPS_CONFIG } from "./start-flying-steps-config.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatantConditionName } from "../../../../conditions/condition-names.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatActionName } from "../../combat-action-names.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME,
  {}
);

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, {});

const gameLogMessageProperties: CombatActionGameLogProperties = new CombatActionGameLogProperties({
  origin: CombatActionOrigin.TriggeredCondition,
  getOnUseMessage: (data) => `${data.nameOfActionUser} starts flying`,
});

const config: CombatActionComponentConfig = {
  description: "",
  prerequisiteAbilities: [],
  gameLogMessageProperties,
  targetingProperties,
  hitOutcomeProperties: createHitOutcomeProperties(
    HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
    {
      getAppliedConditions: (actionUser) => {
        return [
          {
            name: CombatantConditionName.Flying,
            rank: 1,
            stacks: 1,
            appliedBy: {
              entityProperties: actionUser.getEntityProperties(),
              friendOrFoe: FriendOrFoe.Friendly,
            },
          },
        ];
      },
    }
  ),
  costProperties,
  stepsConfig: START_FLYING_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const START_FLYING = new CombatActionLeaf(CombatActionName.StartFlying, config);
