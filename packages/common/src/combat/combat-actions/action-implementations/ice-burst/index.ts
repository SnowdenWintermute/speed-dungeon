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
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";
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
  CombatActionResource,
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
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { CombatantConditionName } from "../../../../combatants/index.js";

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
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user) => {
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
  },
  getAppliedConditions: (combatant, actionlevel) => {
    let userEntityProperties = cloneDeep(combatant.entityProperties);
    if (combatant.combatantProperties.asShimmedUserOfTriggeredCondition) {
      userEntityProperties =
        combatant.combatantProperties.asShimmedUserOfTriggeredCondition.condition.appliedBy
          .entityProperties;
    }

    return [
      {
        conditionName: CombatantConditionName.PrimedForIceBurst,
        level: combatant.combatantProperties.level,
        stacks: 1,
        appliedBy: { entityProperties: userEntityProperties, friendOrFoe: FriendOrFoe.Hostile },
      },
    ];
  },
};

const config: CombatActionComponentConfig = {
  description: "Deals kinetic ice damage in an area around the target",
  origin: CombatActionOrigin.TriggeredCondition,

  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} shatters!`;
  },
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    costBases: {},
  },
  shouldExecute: () => true,

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
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
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
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
    // we just want to get the position of the primary target, even though they aren't
    // going to be part of the final targets as calculated by the hit outcomes.
    // to this end, we use the target as set on the triggered action user combatant shim
    // by the action whenTriggered function
    // use some symantic coupling "oh no, bad practice!" to
    // get the target location instead of trying to use auto target
    // since the action's auto target gives a list of ids and we only
    // want to spawn the explosion on the one selected by the user

    const { party, combatant: user } = context.combatantContext;
    const actionTarget = user.combatantProperties.combatActionTarget;
    if (!actionTarget)
      throw new Error("expected shimmed condition action user to have a target set");
    if (actionTarget.type !== CombatActionTargetType.Single)
      throw new Error("expected shimmed condition action user to have a single target");
    const primaryTargetResult = AdventuringParty.getCombatant(party, actionTarget.targetId);
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;

    const position = primaryTargetResult.combatantProperties.position;

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
