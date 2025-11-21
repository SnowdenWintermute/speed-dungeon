import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionGameLogProperties,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import {
  ActionResolutionStepType,
  ActivatedTriggersGameUpdateCommand,
} from "../../../../action-processing/index.js";
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

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.SUMMON_COMBATANT();

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
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {
    getOnUseTriggers: (context) => {
      const { actionUserContext } = context;
      const { party, actionUser } = actionUserContext;

      const petOption = party.getCombatantSummonedPetOption(actionUser.getEntityId());

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

export const DISMISS_PET = new CombatActionLeaf(CombatActionName.DismissPet, config);
