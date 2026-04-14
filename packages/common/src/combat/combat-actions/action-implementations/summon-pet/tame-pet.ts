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
import { COMBATANT_MAX_LEVEL } from "../../../../app-consts.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionResource } from "../../combat-action-hit-outcome-properties.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionComponentConfig } from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../base-hierarchy-properties.js";
import { CombatActionLeaf } from "../../combat-action-leaf.js";
import { getTamePetMaxPetLevel } from "./get-tame-pet-max-level.js";
import { CombatantId } from "../../../../aliases.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";

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
        reasonDoesNot: ERROR_MESSAGES.COMBAT_ACTIONS.PET_SLOTS_FULL(userMaxTamePetRank),
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
    getResistChance(user, actionRank, target) {
      const { percentOfMaxHitPoints } = target
        .getCombatantProperties()
        .resources.getResourcePercentagesOfMax();

      const targetLevel = target.getLevel();
      const userLevel = user.getLevel();
      const levelDifference = targetLevel - userLevel;
      const levelDifferenceMultiplier = levelDifference / COMBATANT_MAX_LEVEL;

      const rawChanceToResist = percentOfMaxHitPoints + levelDifferenceMultiplier;
      const chanceToResist = Math.max(0, rawChanceToResist);

      return chanceToResist;
    },

    getHitOutcomeTriggers: (context) => {
      const hitTargetId = context.tracker.hitOutcomes.outcomeFlags[HitOutcome.Hit]?.[0];

      const isSuccess = hitTargetId !== undefined;
      if (!isSuccess) {
        return {};
      }

      return {
        petsTamed: [
          {
            petId: hitTargetId as CombatantId,
            tamerId: context.actionUserContext.actionUser.getEntityId() as CombatantId,
          },
        ],
      };
    },
  }
);

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
      [1]: `One pet slot, max pet level: ${getTamePetMaxPetLevel(1)}`,
      [2]: `Two pet slots, max pet level: ${getTamePetMaxPetLevel(2)}`,
      [3]: `Three pet slots, max pet level: ${getTamePetMaxPetLevel(3)}`,
    };
  },
  getByRankShortDescriptions: (user) => {
    return {
      [1]: `Tame the target`,
    };
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
        ProhibitedTargetCombatantStates.IsBeyondUserMaximumPetLevel,
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
