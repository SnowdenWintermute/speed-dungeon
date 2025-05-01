import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  ActionEntityName,
  CosmeticEffectNames,
  AbstractParentType,
} from "../../../../action-entities/index.js";
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
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "An icy projectile",
  targetingProperties,
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  getChildren: (context) => [],
  getParent: () => ICE_BOLT_PARENT,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
  },
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    return previousTrackerOption.actionExecutionIntent.targets;
  },

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getDestination: getPrimaryTargetPositionAsDestination,
        cosmeticsEffectsToStart: [
          {
            name: CosmeticEffectNames.FrostParticleStream,
            parentType: AbstractParentType.VfxEntityRoot,
          },
        ],
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {
        cosmeticsEffectsToStart: [
          {
            name: CosmeticEffectNames.FrostParticleBurst,
            parentType: AbstractParentType.CombatantHitboxCenter,
            lifetime: 300,
          },
        ],
      },
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party } = combatantContext;
    const position = combatantContext.combatant.combatantProperties.position.clone();

    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;
    const target = primaryTargetResult;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.IceBolt,
          parentOption: {
            type: AbstractParentType.UserOffHand,
            parentEntityId: context.combatantContext.combatant.entityProperties.id,
          },
          pointTowardEntityOption: target.entityProperties.id,
        },
      },
    };
  },
};

export const ICE_BOLT_PROJECTILE = new CombatActionComposite(
  CombatActionName.IceBoltProjectile,
  config
);
