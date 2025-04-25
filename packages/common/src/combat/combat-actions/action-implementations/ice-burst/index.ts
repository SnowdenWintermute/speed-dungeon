import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  FriendOrFoe,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG } from "../non-combatant-initiated-actions-common-config.js";
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
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
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
import { ActionEntityName, AbstractParentType } from "../../../../action-entities/index.js";

const config: CombatActionComponentConfig = {
  ...NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG,
  description: "Deals kinetic ice damage in an area around the target",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: {
    scheme: AutoTargetingScheme.BattleGroup,
    friendOrFoe: FriendOrFoe.Hostile,
  },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [],
  prohibitedHitCombatantStates: [
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
    ProhibitedTargetCombatantStates.Dead,
  ],
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Delivery]: {
        name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDelivery },
        timing: { type: AnimationTimingType.Timed, duration: 200 },
        // timing: { type: AnimationTimingType.Timed, duration: 1000 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDissipation },
        timing: { type: AnimationTimingType.Timed, duration: 200 },
        // timing: { type: AnimationTimingType.Timed, duration: 1000 },
      },
    };
    return animations;
  },
  getHpChangeProperties: (user) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: KineticDamageType.Piercing,
      elementOption: MagicalElement.Ice,
      isHealing: false,
      lifestealPercentage: null,
    };

    const stacks = user.asUserOfTriggeredCondition?.stacksOption?.current || 1;

    const baseValues = new NumberRange(user.level * stacks, user.level * stacks * 10);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    return hpChangeProperties;
  },

  getManaChangeProperties: () => null,
  getAppliedConditions: (context) => {
    const { idGenerator, combatantContext } = context;
    const { combatant } = combatantContext;

    const condition = new PrimedForIceBurstCombatantCondition(
      idGenerator.generate(),
      combatant.entityProperties.id,
      combatant.combatantProperties.level
    );

    return [condition];
  },
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return [];
  },
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    // @TODO - base off of activating condition spell level
    return { type: ActionAccuracyType.Unavoidable };
  },
  getCritChance: (user) => BASE_CRIT_CHANCE,
  getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: (user, self) => 15,
  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationSpawnEntity,
      ActionResolutionStepType.OnActivationActionEntityMotion,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
      ActionResolutionStepType.ActionEntityDissipationMotion,
    ];
  },

  getCosmeticEffectToStartByStep() {
    return {
      [ActionResolutionStepType.OnActivationActionEntityMotion]: [
        {
          name: CosmeticEffectNames.FrostParticleBurst,
          parentType: AbstractParentType.VfxEntityRoot,
          lifetime: 300,
        },
      ],
    };
  },

  motionPhasePositionGetters: {},

  getIsParryable: (user) => false,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => false,

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
        entityProperties: { id: context.idGenerator.generate(), name: "explosion" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.IceBurst,
        },
      },
    };
  },
};

export const ICE_BURST = new CombatActionComposite(CombatActionName.IceBurst, config);
