import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
} from "../../index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import {
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
  createTargetingPropertiesConfig,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { createGenericSpellCastMessageProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionExecutionIntent } from "../../combat-action-execution-intent.js";
import { invariant } from "../../../../utils/index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { ActionPayableResource } from "../../action-calculation-utils/action-costs.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BASIC_SPELL();

stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.InitialPositioning],
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.LightParticleAccumulation,
        context
      ),
    ];
  },
};

stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning] = {
  ...stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning],
  getCosmeticEffectsToStop: (context) => [
    CosmeticEffectInstructionFactory.createParticlesOnOffhand(
      CosmeticEffectNames.LightParticleAccumulation,
      context
    ),
  ],
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
  costBases: {
    [ActionPayableResource.Mana]: {
      base: 2,
      additives: {
        actionLevel: 0,
        userCombatantLevel: 0,
      },
    },
    [ActionPayableResource.ActionPoints]: {
      base: 1,
      additives: {
        actionLevel: 0,
        userCombatantLevel: 0,
      },
    },
  },
  getMeetsCustomRequirements: (user, party) => {
    const { combatantManager } = party;
    for (const combatant of combatantManager.getPartyMemberPets()) {
      if (combatant.combatantProperties.controlledBy.summonedBy === user.getEntityId()) {
        return { meetsRequirements: false, reasonDoesNot: "You already have a pet summoned" };
      }
    }

    return { meetsRequirements: true };
  },
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {}
);

const config: CombatActionComponentConfig = {
  description: "Summon a creature companion",
  prerequisiteAbilities: [],
  gameLogMessageProperties: createGenericSpellCastMessageProperties(
    CombatActionName.SummonPetParent
  ),
  getByRankShortDescriptions: (user, party) => {
    const toReturn: { [rank: number]: string | null } = {};
    party.petManager.iteratePetSlots(user.getEntityId()).forEach((petSlot, i) => {
      const { petOption } = petSlot;
      toReturn[i + 1] = petOption?.getName() || "Empty slot";
    });

    return toReturn;
  },
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME,
    {
      executionPreconditions: [
        ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME().executionPreconditions,
        ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.NoPetCurrentlySummoned],
        ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.PetSlotNotEmpty],
      ],
    }
  ),
  hitOutcomeProperties,
  costProperties,
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getConcurrentSubActions(context) {
      const user = context.actionUserContext.actionUser;
      return [
        {
          user,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.SummonPetAppear,
            context.tracker.actionExecutionIntent.rank,
            context.tracker.actionExecutionIntent.targets
          ),
        },
      ];
    },
  },
};

ActionStepConfigUtils.removeMoveForwardSteps(stepsConfig);
const finalPositioningStep = stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning];
invariant(finalPositioningStep !== undefined);
delete finalPositioningStep.getAnimation;
finalPositioningStep.shouldIdleOnComplete = true;

export const SUMMON_PET_PARENT = new CombatActionLeaf(CombatActionName.SummonPetParent, config);
