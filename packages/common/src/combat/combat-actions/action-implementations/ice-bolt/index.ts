import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
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
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { AnimationType, SkeletalAnimationName } from "../../../../app-consts.js";
import { getSpeciesTimedAnimation } from "../get-species-timed-animation.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Summon an icy projectile",
  targetingProperties,
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],

  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineActionAnimations]: {},
      [ActionResolutionStepType.InitialPositioning]: {
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
            timing: { type: AnimationTimingType.Looping },
          };
        },
        cosmeticsEffectsToStart: [
          {
            name: CosmeticEffectNames.FrostParticleAccumulation,
            parentType: AbstractParentType.UserOffHand,
          },
        ],
      },
      [ActionResolutionStepType.ChamberingMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            SkeletalAnimationName.CastSpellChambering
          ),
      },
      [ActionResolutionStepType.DeliveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.CastSpellDelivery),
      },
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.StartConcurrentSubActions]: {},
      [ActionResolutionStepType.RecoveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.CastSpellDelivery),
      },
      [ActionResolutionStepType.FinalPositioning]: {
        isConditionalStep: true,
        cosmeticsEffectsToStop: [CosmeticEffectNames.FrostParticleAccumulation],
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
            timing: { type: AnimationTimingType.Looping },
          };
        },
      },
    },
    true
  ),

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
