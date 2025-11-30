import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionResource,
  createGenericSpellCastMessageProperties,
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
import cloneDeep from "lodash.clonedeep";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";

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
    [CombatActionResource.Mana]: {
      base: 0,
      additives: {
        actionLevel: 0,
        userCombatantLevel: 0,
      },
    },
  },
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION,
  {
    getOnUseTriggers: (context) => {
      const { rank } = context.tracker.actionExecutionIntent;
      const petSlot = rank - 1;

      const { actionUserContext } = context;
      const { actionUser } = actionUserContext;

      const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {
        petSlotsReleased: [{ ownerId: actionUser.getEntityId(), slotIndex: petSlot }],
      };

      return toReturn;
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Permenantly release your creature companion",
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
      ],
    }
  ),
  hitOutcomeProperties,
  costProperties,
  stepsConfig,
  hierarchyProperties: cloneDeep(BASE_ACTION_HIERARCHY_PROPERTIES),
};

ActionStepConfigUtils.removeMoveForwardSteps(stepsConfig);
delete stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning]?.getAnimation;
stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning]!.shouldIdleOnComplete = true;

export const RELEASE_PET = new CombatActionLeaf(CombatActionName.SummonPetParent, config);
