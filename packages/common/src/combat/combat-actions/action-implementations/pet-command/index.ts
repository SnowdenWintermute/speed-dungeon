import {
  ActionPayableResource,
  CombatActionComponentConfig,
  CombatActionGameLogProperties,
  CombatActionLeaf,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { PET_COMMAND_HIT_OUTCOME_PROPERTIES } from "./pet-command-hit-outcome-properties.js";
import { PET_COMMAND_STEPS_CONFIG } from "./pet-command-steps-config.js";
import { PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK } from "../../../../conditions/configs/following-pet-command.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.PET_OF_USER(),
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  costBases: { [ActionPayableResource.Mana]: { base: 1 } },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, {
  costBases: {
    [ActionPayableResource.Mana]: {
      base: 1,
    },
  },
  getMeetsCustomRequirements: (user, party) => {
    const { combatantManager } = party;
    for (const combatant of combatantManager.getPartyMemberPets()) {
      if (combatant.combatantProperties.controlledBy.summonedBy === user.getEntityId()) {
        return { meetsRequirements: true };
      }
    }

    return {
      meetsRequirements: false,
      reasonDoesNot: "You must have a pet summoned",
    };
  },
});

const gameLogMessageProperties: CombatActionGameLogProperties =
  createGenericSpellCastMessageProperties(CombatActionName.PetCommand);

const config: CombatActionComponentConfig = {
  description: "Give your pet new priorities",
  getByRankShortDescriptions: () => {
    return PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK;
  },
  prerequisiteAbilities: [],
  gameLogMessageProperties,
  targetingProperties,
  hitOutcomeProperties: PET_COMMAND_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig: PET_COMMAND_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const PET_COMMAND = new CombatActionLeaf(CombatActionName.PetCommand, config);
