import {
  ActionPayableResource,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  getStandardActionCost,
} from "../../index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { getSpellCastActionStepAnimations } from "../spell-cast-action-step-animations.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { AbstractParentType } from "../../../../action-entities/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { iceBoltProjectileHitOutcomeProperties } from "./ice-bolt-hit-outcome-properties.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Summon an icy projectile",
  targetingProperties,
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  incursDurabilityLoss: {},
  costBases: {
    [ActionPayableResource.Mana]: {
      base: 3,
      multipliers: {
        actionLevel: 1.2,
        userCombatantLevel: 1.2,
      },
      additives: {
        actionLevel: 1,
        userCombatantLevel: 1,
      },
    },
  },
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: getStandardActionCost,
  requiresCombatTurn: (context) => true,
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
  getCosmeticEffectToStartByStep() {
    return {
      [ActionResolutionStepType.InitialPositioning]: [
        {
          name: CosmeticEffectNames.FrostParticleAccumulation,
          parentType: AbstractParentType.UserOffHand,
        },
      ],
    };
  },
  getCosmeticEffectToStopByStep() {
    return {
      [ActionResolutionStepType.FinalPositioning]: [CosmeticEffectNames.FrostParticleAccumulation],
    };
  },
  getResolutionSteps() {
    return [
      ActionResolutionStepType.DetermineActionAnimations,
      // spawn spellcasting glyph at feet
      ActionResolutionStepType.InitialPositioning,
      // spawn particle effect on hand
      ActionResolutionStepType.ChamberingMotion,
      ActionResolutionStepType.DeliveryMotion,
      // despawn original particle effect
      // spawn particle effect burst
      // despawn spellcasting glyph
      ActionResolutionStepType.PayResourceCosts,
      ActionResolutionStepType.EvalOnUseTriggers,
      ActionResolutionStepType.StartConcurrentSubActions,
      ActionResolutionStepType.RecoveryMotion,
    ];
  },
  getActionStepAnimations: getSpellCastActionStepAnimations,
};

export const ICE_BOLT_PARENT = new CombatActionLeaf(CombatActionName.IceBoltParent, config);
