import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { AbstractParentType } from "../../../../action-entities/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { iceBoltProjectileHitOutcomeProperties } from "./ice-bolt-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { getProjectileShootingActionBaseStepsConfig } from "../projectile-shooting-action-base-steps-config.js";
import { ProjectileShootingActionType } from "../projectile-shooting-action-animation-names.js";

const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Spell);
stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.InitialPositioning],
  cosmeticsEffectsToStart: [
    {
      name: CosmeticEffectNames.FrostParticleAccumulation,
      parentType: AbstractParentType.UserOffHand,
    },
  ],
};
stepsConfig.steps[ActionResolutionStepType.FinalPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.FinalPositioning],
  cosmeticsEffectsToStop: [CosmeticEffectNames.FrostParticleAccumulation],
};

const config: CombatActionComponentConfig = {
  description: "Summon an icy projectile",
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],

  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  stepsConfig,

  shouldExecute: () => true,
  getConcurrentSubActions(context) {
    const { combatActionTarget } = context.combatant.combatantProperties;
    if (!combatActionTarget) throw new Error("expected combatant target not found");
    return [
      new CombatActionExecutionIntent(CombatActionName.IceBoltProjectile, combatActionTarget),
    ];
  },
  getChildren: () => [],
  getParent: () => null,
};

export const ICE_BOLT_PARENT = new CombatActionLeaf(CombatActionName.IceBoltParent, config);
