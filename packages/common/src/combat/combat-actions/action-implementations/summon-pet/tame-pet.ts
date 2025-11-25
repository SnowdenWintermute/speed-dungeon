import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionGameLogProperties,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  CombatActionResource,
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
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";
import { HitOutcome } from "../../../../hit-outcome.js";
import { TAME_PET_STEP_CONFIG } from "./tame-pet-steps-config.js";
import { AbilityType } from "../../../../abilities/ability-types.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
  getMeetsCustomRequirements: (user, party) => {
    const occupiedPetSlotsCount = party.petManager.getOwnerOccupiedPetSlotsCount(
      user.getEntityId()
    );
    const userMaxTamePetRank = user.getCombatantProperties().abilityProperties.getAbilityRank({
      type: AbilityType.Action,
      actionName: CombatActionName.TamePet,
    });
    if (occupiedPetSlotsCount >= userMaxTamePetRank) {
      return {
        meetsRequirements: false,
        reasonDoesNot: `You already have the maximum number of tamed pets for your Tame Pet action rank (${userMaxTamePetRank})`,
      };
    }

    return { meetsRequirements: true };
  },
  costBases: {
    [CombatActionResource.Mana]: {
      base: 2,
      additives: {
        actionLevel: 0,
        userCombatantLevel: 0,
      },
    },
  },
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {
    getIsResisted() {
      // @TODO
      // check the hp of the pet is below a threshold based on something
      // check the difference in level user-target

      return false;
    },

    getHitOutcomeTriggers: (context) => {
      const hitTargetId = context.tracker.hitOutcomes.outcomeFlags[HitOutcome.Hit]?.[0];

      const isSuccess = hitTargetId !== undefined;
      if (!isSuccess) {
        return {};
      }

      return {
        petsTamed: [
          { petId: hitTargetId, tamerId: context.actionUserContext.actionUser.getEntityId() },
        ],
      };
    },
  }
);

export function getTamePetMaxPetLevel(actionRank: number) {
  const BASE_SUMMONED_PET_LEVEL = 4;
  const PET_LEVEL_PER_SUMMON_PET_RANK = 2;
  const levelBonus = PET_LEVEL_PER_SUMMON_PET_RANK * actionRank;
  return BASE_SUMMONED_PET_LEVEL + levelBonus;
}

const config: CombatActionComponentConfig = {
  description: "Attempt to convince a creature to join your pack.",
  selectableRankLimit: 1,
  prerequisiteAbilities: [],
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => `${data.nameOfActionUser} attempts to tame ${data.nameOfTarget}`,
  }),
  getByRankDescriptions: () => {
    return {
      [1]: `One pet slot, max pet level ${getTamePetMaxPetLevel(1)}`,
      [2]: `Two pet slots, ${getTamePetMaxPetLevel(2)}`,
      [3]: `Three pet slots, ${getTamePetMaxPetLevel(3)}`,
    };
  },
  getByRankShortDescriptions: () => {
    return { [1]: "Attempt to tame the target" };
  },
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
    {
      executionPreconditions: [
        ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE().executionPreconditions,
        ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.NoPetCurrentlySummoned],
      ],
      prohibitedTargetCombatantStates: [
        ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE().prohibitedTargetCombatantStates,
        ProhibitedTargetCombatantStates.IsNotTameable,
      ],
    }
  ),
  hitOutcomeProperties,
  costProperties,
  stepsConfig: TAME_PET_STEP_CONFIG,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
  },
};

export const TAME_PET = new CombatActionLeaf(CombatActionName.TamePet, config);
