import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES } from "./ice-bolt-hit-outcome-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { AbilityType } from "../../../../abilities/index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_SPELL();

stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.InitialPositioning],
  getCosmeticEffectsToStart: (context) => {
    return [
      CosmeticEffectInstructionFactory.createParticlesOnOffhand(
        CosmeticEffectNames.FrostParticleAccumulation,
        context
      ),
    ];
  },
};
stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning] = {
  ...stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning],
  getCosmeticEffectsToStop: (context) => [
    CosmeticEffectInstructionFactory.createParticlesOnOffhand(
      CosmeticEffectNames.FrostParticleAccumulation,
      context
    ),
  ],
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: () => false,
};

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Summon an icy projectile",
  prerequisiteAbilities: [{ type: AbilityType.Action, actionName: CombatActionName.Firewall }],
  combatLogMessageProperties: createGenericSpellCastMessageProperties(
    CombatActionName.IceBoltProjectile
  ),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE(),
  hitOutcomeProperties: ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getConcurrentSubActions(context) {
      return [
        new CombatActionExecutionIntent(
          CombatActionName.IceBoltProjectile,
          context.tracker.actionExecutionIntent.targets,
          context.tracker.actionExecutionIntent.level
        ),
      ];
    },
  },
};

export const ICE_BOLT_PARENT = new CombatActionLeaf(CombatActionName.IceBoltParent, config);
