import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
} from "../../index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ENSNARE_WEB_TRAVEL_AND_ACTIVATE_STEPS_CONFIG } from "./ensnare-web-travel-and-activate-steps-config.js";
import { ThreatType } from "../../../../combatants/threat-manager/index.js";
import { CombatantConditionName } from "../../../../conditions/condition-names.js";
import { ActivatedTriggersGameUpdateCommand } from "../../../../action-processing/game-update-commands.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { createGenericSpellCastMessageProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL,
  {
    getOnUseTriggers: (context) => {
      const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {};

      return toReturn;
    },
    getAppliedConditions: (user, actionRank) => {
      return [
        {
          name: CombatantConditionName.Ensnared,
          rank: actionRank,
          stacks: 1,
          appliedBy: {
            entityProperties: user.getEntityProperties(),
            friendOrFoe: FriendOrFoe.Hostile,
          },
        },
      ];
    },
    flatThreatGeneratedOnHit: { [ThreatType.Volatile]: 800, [ThreatType.Stable]: 1 },
  }
);

const config: CombatActionComponentConfig = {
  description: "Net travels toward target and ensnares them",
  prerequisiteAbilities: [],
  gameLogMessageProperties: createGenericSpellCastMessageProperties(
    CombatActionName.EnsnareMoveNetTowardTargetAndActivate
  ),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE(),
  hitOutcomeProperties,
  costProperties,
  stepsConfig: ENSNARE_WEB_TRAVEL_AND_ACTIVATE_STEPS_CONFIG,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
  },
};

export const ENSNARE_WEB_TRAVEL_AND_ACTIVATE = new CombatActionLeaf(
  CombatActionName.EnsnareMoveNetTowardTargetAndActivate,
  config
);
