import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
} from "../../index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
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
import { ActivatedTriggersGameUpdateCommand } from "../../../../action-processing/game-update-commands.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatActionName } from "../../combat-action-names.js";
import { invariant } from "../../../../utils/index.js";
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
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, {
  getMeetsCustomRequirements: (user, party) => {
    const { combatantManager } = party;
    for (const combatant of combatantManager.getPartyMemberPets()) {
      if (combatant.combatantProperties.controlledBy.summonedBy === user.getEntityId()) {
        return { meetsRequirements: true };
      }
    }

    return {
      meetsRequirements: false,
      reasonDoesNot: "You must have a pet summoned in order to dismiss it",
    };
  },
  requiresCombatTurnInThisContext: () => false,
  costBases: { [ActionPayableResource.Mana]: { base: 0 } },
});

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {
    getOnUseTriggers: (context) => {
      const { actionUserContext } = context;
      const { party, actionUser } = actionUserContext;

      const petOption = party.petManager.getCombatantSummonedPetOption(actionUser.getEntityId());

      if (petOption === undefined) return {};

      const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {
        petsUnsummoned: [petOption.getEntityId()],
      };

      return toReturn;
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Temporarily unsummon your pet. You can call it back later.",
  prerequisiteAbilities: [],
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => `${data.nameOfActionUser} dismisses their pet`,
  }),
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME,
    {
      executionPreconditions: [
        ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME().executionPreconditions,
        ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.PetCurrentlySummoned],
      ],
    }
  ),
  hitOutcomeProperties,
  costProperties,
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
  },
};

// @TODO - create a template for these
ActionStepConfigUtils.removeMoveForwardSteps(stepsConfig);
const finalPositioningStep = stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning];
invariant(finalPositioningStep !== undefined);
delete finalPositioningStep.getAnimation;
finalPositioningStep.shouldIdleOnComplete = true;

export const DISMISS_PET = new CombatActionLeaf(CombatActionName.DismissPet, config);
