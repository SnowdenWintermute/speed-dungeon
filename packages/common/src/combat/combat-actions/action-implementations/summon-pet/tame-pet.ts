import {
  ActionResolutionStepConfig,
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionGameLogProperties,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  CosmeticEffectOnTargetTransformNode,
} from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
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
import { HitOutcome } from "../../../../hit-outcome.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { COMBAT_ACTIONS } from "../index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";

const mainStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};
const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

mainStepOverrides[ActionResolutionStepType.InitialPositioning] = {
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.LightParticleAccumulation,
        context
      ),
    ];
  },
};

finalStepOverrides[ActionResolutionStepType.RecoveryMotion] = {
  getCosmeticEffectsToStart: (context) => {
    const { actionExecutionIntent } = context.tracker;
    const targetingCalculator = new TargetingCalculator(context.actionUserContext, null);

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
      COMBAT_ACTIONS[actionExecutionIntent.actionName],
      actionExecutionIntent.targets
    );
    if (targetIdsResult instanceof Error) throw targetIdsResult;

    const toReturn: CosmeticEffectOnTargetTransformNode[] = targetIdsResult.map((targetId) => {
      return {
        name: CosmeticEffectNames.HeartParticles,
        lifetime: 700,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: targetId,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.Head,
        },
      };
    });

    toReturn.push({
      name: CosmeticEffectNames.HeartParticles,
      lifetime: 700,
      parent: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: context.actionUserContext.actionUser.getEntityId(),
        },
        transformNodeName: CombatantBaseChildTransformNodeName.Head,
      },
    });

    return toReturn;
  },
};

finalStepOverrides[ActionResolutionStepType.FinalPositioning] = {
  getCosmeticEffectsToStop: (context) => [
    CosmeticEffectInstructionFactory.createParticlesOnOffhand(
      CosmeticEffectNames.LightParticleAccumulation,
      context
    ),
  ],
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BASIC_SPELL;
const stepsConfig = createStepsConfig(base, {
  steps: mainStepOverrides,
  finalSteps: finalStepOverrides,
});

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
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

const config: CombatActionComponentConfig = {
  description: "Attempt to convince a creature to join your pack.",
  prerequisiteAbilities: [],
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => `${data.nameOfActionUser} attempts to tame ${data.nameOfTarget}`,
  }),
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
    {
      executionPreconditions: [
        ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE().executionPreconditions,
        ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.NoPetCurrentlySummoned],
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

export const TAME_PET = new CombatActionLeaf(CombatActionName.TamePet, config);
