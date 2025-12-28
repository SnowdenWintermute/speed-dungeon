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
import {
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
  createTargetingPropertiesConfig,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  ENSNARE_STEPS_CONFIG,
  getWebInherentAffinities,
  getWebMaxHp,
} from "./ensnare-steps.config.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { getEnsnaredEvasionChange } from "../../../../conditions/configs/ensnared.js";
import { createGenericSpellCastMessageProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionExecutionIntent } from "../../combat-action-execution-intent.js";

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {};
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {}
);

const config: CombatActionComponentConfig = {
  description:
    "Throw a net that forces flyers to the ground, reduces their evasion and forces them to only target the net or themself. Net's hit points are based on user's level and a combination of their dexterity and strength with a balance of both being the most effective.",
  prerequisiteAbilities: [],
  getByRankDescriptions: (user) => {
    const toReturn: Record<number, string> = {};

    for (let rank = 1; rank <= 3; rank += 1) {
      const affinities = getWebInherentAffinities(rank);
      const hp = getWebMaxHp(user, rank);
      const description = `
            Net's HP: ${hp}, fire/slashing weakness: ${Math.abs(affinities.fireAffinity)},
            blunt/piercing resistance: ${Math.abs(affinities.bluntAffinity)}. 
            Reduces target evasion by ${Math.abs(getEnsnaredEvasionChange(rank))}`;
      toReturn[rank] = description;
    }

    return toReturn;
  },
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
