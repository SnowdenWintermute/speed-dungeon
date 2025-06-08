import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
  FriendOrFoe,
  TargetCategories,
} from "../../index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  AnimationType,
  BASE_EXPLOSION_RADIUS,
  DynamicAnimationName,
} from "../../../../app-consts.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";
import { PrimedForIceBurstCombatantCondition } from "../../../../combatants/combatant-conditions/primed-for-ice-burst.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import cloneDeep from "lodash.clonedeep";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionEntityName } from "../../../../action-entities/index.js";
import {
  CombatActionTargetingPropertiesConfig,
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  ActionEntityBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...cloneDeep(GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle]),
  prohibitedTargetCombatantStates: [],
  prohibitedHitCombatantStates: [
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
    ProhibitedTargetCombatantStates.Dead,
  ],
  autoTargetSelectionMethod: {
    scheme: AutoTargetingScheme.WithinRadiusOfEntity,
    radius: BASE_EXPLOSION_RADIUS,
    validTargetCategories: TargetCategories.Any,
    excludePrimaryTarget: true,
  },
};

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Spell],
  getArmorPenetration: (user, self) => 15,
  getHpChangeProperties: (user) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: KineticDamageType.Piercing,
      elementOption: MagicalElement.Ice,
      isHealing: false,
      lifestealPercentage: null,
    };

    const stacks = user.asShimmedUserOfTriggeredCondition?.condition.stacksOption?.current || 1;

    const baseValues = new NumberRange(user.level * stacks, user.level * stacks * 10);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    return hpChangeProperties;
  },
  getAppliedConditions: (context) => {
    const { idGenerator, combatantContext } = context;
    const { combatant } = combatantContext;

    const condition = new PrimedForIceBurstCombatantCondition(
      idGenerator.generate(),
      { entityProperties: cloneDeep(combatant.entityProperties), friendOrFoe: FriendOrFoe.Hostile },
      combatant.combatantProperties.level
    );

    return [condition];
  },
};

const config: CombatActionComponentConfig = {
  description: "Deals kinetic ice damage in an area around the target",
  origin: CombatActionOrigin.TriggeredCondition,
  targetingProperties,
  hitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
  shouldExecute: () => true,

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getAnimation: () => {
          return {
            name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDelivery },
            timing: { type: AnimationTimingType.Timed, duration: 200 },
            smoothTransition: false,
            // timing: { type: AnimationTimingType.Timed, duration: 1000 },
          };
        },
        getCosmeticsEffectsToStart: (context) => {
          const iceBurstEntity = context.tracker.getExpectedSpawnedActionEntity();
          return [
            {
              name: CosmeticEffectNames.FrostParticleBurst,
              parent: {
                sceneEntityIdentifier: {
                  type: SceneEntityType.ActionEntityModel,
                  entityId: iceBurstEntity.actionEntity.entityProperties.id,
                },
                transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
              },
              lifetime: 300,
            },
          ];
        },
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.ActionEntityDissipationMotion]: {
        getAnimation: () => {
          return {
            name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDissipation },
            timing: { type: AnimationTimingType.Timed, duration: 200 },
            // timing: { type: AnimationTimingType.Timed, duration: 1000 },
            //
            smoothTransition: false,
          };
        },
        shouldDespawnOnComplete: () => true,
      },
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return [];
  },

  getSpawnableEntity: (context) => {
    // this action targets the sides, but we want to spawn the vfx on the center target
    // so we'll clone and modify the action intent
    const actionExecutionIntent = cloneDeep(context.tracker.actionExecutionIntent);
    actionExecutionIntent.targets.type = CombatActionTargetType.Single;

    const { party } = context.combatantContext;
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
    const primaryTargetIdResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetIdResult instanceof Error) throw primaryTargetIdResult;

    const position = primaryTargetIdResult.combatantProperties.position;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "ice burst" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.IceBurst,
        },
      },
    };
  },
};

export const ICE_BURST = new CombatActionComposite(CombatActionName.IceBurst, config);
