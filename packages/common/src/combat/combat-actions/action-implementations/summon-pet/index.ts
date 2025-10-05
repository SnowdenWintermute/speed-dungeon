import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import {
  ActionResolutionStepType,
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../../../../action-processing/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";

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
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {
    getOnUseTriggers: (context) => {
      const { rank } = context.tracker.actionExecutionIntent;
      const petSlot = rank - 1;
      console.log("pet slot:", petSlot);

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
  combatLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.SummonPet),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME(),
  hitOutcomeProperties,
  costProperties,
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getConcurrentSubActions(context) {
      // const user = context.tracker.getFirstExpectedSpawnedActionEntity().actionEntity;
      // maybe a pet appear action that has the pet do an entry animation on itself
      return [];
    },
  },
};

export const SUMMON_PET = new CombatActionLeaf(CombatActionName.SummonPet, config);
